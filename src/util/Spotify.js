import React from "react";

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = 'http://localhost:3000/'; // Have to add this to your accepted Spotify redirect URIs on the Spotify API.
const scope = "playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative"
const authUrl = new URL("https://accounts.spotify.com/authorize")
let accessToken;
let userId;

const Spotify = {
    //Authorization code with PKCE flow
    async getUserAuthorization() {
        //Set Authentication code expiry to 10 minutes
        window.localStorage.setItem("code_expired", false);

        // Code verifier
        const generateRandString = (length) => {
            const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            const values = crypto.getRandomValues(new Uint8Array(length));
            return values.reduce((acc, x) => acc + possible[x % possible.length], "");
        }
        const codeVerifier = generateRandString(64);

        // Code Challenge
        const sha256 = async (plain) => {
            const encoder = new TextEncoder()
            const data = encoder.encode(plain)
            return window.crypto.subtle.digest('SHA-256', data)
        }

        const base64encode = (input) => {
            return btoa(String.fromCharCode(...new Uint8Array(input)))
              .replace(/=/g, '')
              .replace(/\+/g, '-')
              .replace(/\//g, '_');
        }
        
        const hashed = await sha256(codeVerifier)
        const codeChallenge = base64encode(hashed);
        
        // Request User Authorization
        window.localStorage.setItem("code_verifier", codeVerifier);

        const params = {
            response_type: "code",
            client_id: clientId,
            scope,
            code_challenge_method: "S256",
            code_challenge: codeChallenge,
            redirect_uri: redirectUri
        }

        // Having an alert helps with debugging problems before redirection
        // alert("Pause before redirection");

        localStorage.setItem("isAuthenticating", "true");

        authUrl.search = new URLSearchParams(params).toString();
        window.location.replace(authUrl.toString());
        // If the user accepts the requested permissions, the OAuth service redirects the user back to the URL specified in the redirect_uri field. This callback contains two query parameters within the URL: 
        // 1. code(An authorization code that can be exchanged for an access token.)
        // 2. state(The value of the state parameter supplied in the request.)
    },
    
    async getAccessToken() {
        accessToken = localStorage.getItem("access_token");
        const tokenExpiresIn = localStorage.getItem("token_expires_in");
        const tokenTimestamp = localStorage.getItem("token_timestamp")

        //Run the code below in the browser console to test out what happens when the token has expired
        // localStorage.setItem("token_expires_in", 1);

        // If token exists and hadn't expired, return it
        if (accessToken && Date.now() < parseInt(tokenTimestamp) + (parseInt(tokenExpiresIn) * 1000)) {
            return accessToken;

        } else {
            // Else get a new Access Token
            // Parse the response URL to retrieve the code parameter
            const urlParams = new URLSearchParams(window.location.search);
            let code = urlParams.get('code');
            let codeExpired = localStorage.getItem("code_expired")
            
            if (!code || codeExpired === "true") {
                await Spotify.getUserAuthorization();
                return;
                // After the user has given authorization, the window will refresh, triggering the useEffect(), so the app will automatically get the access token via the else statement below

            } else {
                window.localStorage.setItem("code_expired", true);
                
                // Request access token
                let codeVerifier = localStorage.getItem("code_verifier");

                const payload = {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: clientId,
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: redirectUri,
                        code_verifier: codeVerifier,
                    }),
                }

                try {
                    const response = await fetch("https://accounts.spotify.com/api/token", payload);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const jsonResponse = await response.json();

                    localStorage.setItem("access_token", jsonResponse.access_token);
                    localStorage.setItem("token_expires_in", jsonResponse.expires_in);
                    localStorage.setItem("token_timestamp", Date.now());

                    return localStorage.getItem("access_token");

                } catch(error) {
                    console.error("Error fetching token:", error);
                    return null;
                }
                
            };
        };
    },

    async search(term, playlistName, userPlaylist) {
        // Save the user's progress to localStorage before getting access token
        localStorage.setItem("search_term", term);
        if (playlistName) {
            window.localStorage.setItem("playlist_name", playlistName);
        }
        if (userPlaylist) {
            const userPlaylistStr = JSON.stringify(userPlaylist);
            window.localStorage.setItem("playlist_tracks", userPlaylistStr);
        }
        accessToken = await this.getAccessToken();

        if (!accessToken) {
            throw new Error('Failed to retrieve access token');
        }

        try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${term}&type=track,artist,album`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonResponse = await response.json();
            if (!jsonResponse.tracks) {
                console.log("No json response. Returning empty array");
                return null;
            }

            const tracks =  jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album,
                uri: track.uri
            }));
            return tracks;

        } catch(error) {
            console.error("Error fetching data:", error)
            return null;
        }
    },

    async getCurrentUserId() {
        accessToken = await this.getAccessToken();

        if (!accessToken) {
            throw new Error('Failed to retrieve access token');
        };

        if (userId) {
            return userId;
        };

        try {
            // Get user ID
            const response = await fetch(`https://api.spotify.com/v1/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonResponse = await response.json();
            userId = jsonResponse.id;

            return userId;

        } catch(error) {
            console.error("Error getting User ID:", error);
            return null;
        }
    },

    async savePlaylist(playlistName, userPlaylist, currentPlaylistId, initialPlaylist, initialPlaylistName) {
        if (!playlistName || !userPlaylist) {
            alert("Name your playlist and add some tracks")
            return;
        }

        // Save the user's progress to localStorage
        window.localStorage.setItem("playlist_name", playlistName);
        const userPlaylistStr = JSON.stringify(userPlaylist);
        window.localStorage.setItem("playlist_tracks", userPlaylistStr);

        // Get track URIs from the user playlist & check changes to playlist
        let currentTrackUris = [];
        let initialTrackUris = [];

        userPlaylist.forEach(track => {
            currentTrackUris.push(track.uri);
        })

        if (initialPlaylist.length > 0) {
            initialPlaylist.forEach(track => {
                initialTrackUris.push(track.uri);
            })
        }

        // Check what changed between the old and new playlist
        const addTrackUris = currentTrackUris.filter(
            (currentTrackUri) => !initialTrackUris.includes(currentTrackUri)
        )
        const removeTrackUris = initialTrackUris.filter(
            (currentTrackUri) => !currentTrackUris.includes(currentTrackUri)
        )

        // convert removeTrackUris to array of objects with "uri" being the key
        const removeTrackUriObjs = removeTrackUris.map(
            (uri) => ({ "uri": uri})
        );

        accessToken = await this.getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to retrieve access token');
        }

        const headers = { "Authorization": `Bearer ${accessToken}` }
        userId = await this.getCurrentUserId();
        let playlistId;

        try {
            // Check if currentPlaylistId is passed. This checks whether it's an existing playlist or not
            if (currentPlaylistId && currentPlaylistId !== "undefined") {
                playlistId = currentPlaylistId;

            } else {
                // If currentPlaylistId is not passed, create new playlist
                const getPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ name: playlistName })
                });
                if (!getPlaylistResponse.ok) {
                    throw new Error('Failed to retrieve playlist id');
                }
                const playlistJson = await getPlaylistResponse.json();
                playlistId = playlistJson.id;
            };

            // Add tracks to the playlist
            if (addTrackUris.length > 0) {
                const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ uris: addTrackUris })
                });
                if (!addTracksResponse.ok) {
                    throw new Error("Failed to add tracks to playlist")
                }
            }

            // Remove tracks to the playlist
            if (removeTrackUris.length > 0) {
                const removeTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                    method: "DELETE",
                    headers: headers,
                    body: JSON.stringify({ tracks: removeTrackUriObjs })
                });
                if (!removeTracksResponse.ok) {
                    throw new Error("Failed to remove tracks from playlist")
                }
            }

            // Rename playlist
            if (playlistName !== initialPlaylistName) {
                const renamePlaylistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                    method: "PUT",
                    headers: headers,
                    body: JSON.stringify({ name: playlistName })
                });
                if (!renamePlaylistResponse.ok) {
                    throw new Error("Failed to rename playlist")
                }
            }

            alert(`${playlistName} has been saved!`);

            localStorage.removeItem("search_term");
            localStorage.removeItem("playlist_name");
            localStorage.removeItem("playlist_tracks");
            localStorage.removeItem("playlist_id");

        } catch (error) {
            alert("There was an issue saving the playlist. Please try again.");
            console.error("Error saving playlist:", error)
        }
    },

    async getUserPlaylists() {
        accessToken = await this.getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to retrieve access token');
        }

        const headers = { "Authorization": `Bearer ${accessToken}` }
        userId = await this.getCurrentUserId();

        try {
            const getUserPlaylistsResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                method: "GET",
                headers: headers
            });
            if (!getUserPlaylistsResponse) {
                throw new Error(`Failed to retrieve user's playlists`);
            }
            const userPlaylistsJson = await getUserPlaylistsResponse.json()

            const userPlaylists = userPlaylistsJson.items.map(playlist => ({
                playlistId: playlist.id,
                name: playlist.name
            }))
            
            return userPlaylists;

        } catch(error) {
            alert("There was an issue getting the user's playlists. Please try again.");
            console.error("Error getting user's playlist:", error)
        }
    },

    async getPlaylist(playlistId) {
        accessToken = await this.getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to retrieve access token');
        }

        const headers = { "Authorization": `Bearer ${accessToken}` }
        userId = await this.getCurrentUserId();

        try {
            const getPlaylistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                method: "GET",
                headers: headers
            });
            if (!getPlaylistResponse) {
                throw new Error('Failed to retrieve users playlists');
            }
            const playlistJson = await getPlaylistResponse.json()

            const playlistName = playlistJson.name;
            const playlistTracks = playlistJson.tracks.items.map((track) => ({
                id: track.track.id,
                name: track.track.name,
                artist: track.track.artists[0].name,
                album: track.track.album,
                uri: track.track.uri
            }))

            return [playlistName, playlistTracks];

        } catch(error) {
            alert("There was an issue getting this particular playlist. Please try again.");
            console.error("Error getting this particular playlist:", error)
        }
    }
};

export default Spotify;