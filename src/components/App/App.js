import styles from './App.module.css';
import React, { useState, useEffect } from 'react';

import SearchBar from '../SearchBar/SearchBar';
import SearchResults from '../SearchResults/SearchResults';
import Playlist from "../Playlist/Playlist"
import Spotify from '../../util/Spotify';

function App() {
  const [userInput, setUserInput] = useState("");
  const handleUserInput = (event) => {
    setUserInput(event.target.value);
  };

  // Having the whole search results and the results that are actually diplayed separated helps with updating what the user sees whenever there's a change in the working playlist
  const [searchResults, setSearchResults] = useState([]);
  const [displayResults, setDisplayResults] = useState([]);
  const handleSearch = async (event) => {
    event.preventDefault();

    const userInputLC = userInput.toLowerCase();

    // Check for playlist tracks in local storage
    let localTracksJson = localStorage.getItem("playlist_tracks");
    let localTracksArr = [];
    if (localTracksJson) {
      localTracksArr = JSON.parse(localTracksJson);
    };

    if (!userInputLC) {
      alert("Invalid input.")
    } else {
      try {
        const tracksArr = await Spotify.search(userInputLC, playlistName, userPlaylist)

        setSearchResults(tracksArr);

        // Create an array of track IDs from the userTracksArr
        const userTrackIds = localTracksArr.map(track => track.id)

        // Filter tracks that are not in the userTracksArr by comparing IDs
        const filteredTracks = tracksArr.filter(
          (searchTrack) => !userTrackIds.includes(searchTrack.id)
        );

        setDisplayResults(filteredTracks);

      } catch(error) {
        console.error(`Error running search: ${error}`);
      }
    };
  };
  
  const [userPlaylist, setUserPlaylist] = useState([]);
  const handleAddTrack = ({target}) => {
    const selectedSongId = target.value;

    // Check for playlist tracks in local storage
    let localTracksJson = localStorage.getItem("playlist_tracks");
    let localTracksArr = [];
    if (localTracksJson) {
      localTracksArr = JSON.parse(localTracksJson);
    };
    
    let trackToAdd;
    
    searchResults.forEach((track) => {
      if (track.id === selectedSongId) {
        if (!userPlaylist.includes(track)) {
          trackToAdd = track
          setUserPlaylist((prev) => [trackToAdd, ...prev]);
        }

        // Added songs are removed from search results
        setDisplayResults((prev) => prev.filter(
          (searchTrack) => searchTrack.id !== selectedSongId
        ))
      }
    })

    // Save user playlist tracks in local storage
    localTracksArr.push(trackToAdd)
    localTracksJson = JSON.stringify(localTracksArr)
    localStorage.setItem("playlist_tracks", localTracksJson)
  };

  const handleDeleteTrack = ({target}) => {
    // Check for playlist tracks in local storage
    let localTracksJson = localStorage.getItem("playlist_tracks");
    let localTracksArr = [];
    if (localTracksJson) {
      localTracksArr = JSON.parse(localTracksJson);
    };
    
    let trackToRemoveId;
    userPlaylist.forEach((track) => {
      if (track.id === target.value) {
        trackToRemoveId = track.id;
      }
    });

    // Remove track from userPlaylist
    setUserPlaylist((prev) => prev.filter(
      (track) => track.id !== trackToRemoveId
    ));

    // Create an array of track IDs from the searchResults and displayResults
    const searchTrackIds = searchResults.map(track => track.id);

    // Check if removed song is part of searchResults
    if (searchTrackIds.includes(trackToRemoveId)) {
      const trackToRemove = searchResults.filter(
        (searchTrack) => searchTrack.id === trackToRemoveId
      )

      // Removed songs are added back to search results if it is part of the current results
      setDisplayResults((prev) => [...trackToRemove, ...prev])
    };

    // Remove song from localStorage
    const filteredLocalTracks = localTracksArr.filter(
      (track) => track.id !== trackToRemoveId
    );

    // Update localStorage
    localTracksJson = JSON.stringify(filteredLocalTracks);
    localStorage.setItem("playlist_tracks", localTracksJson);
  };

  const[initialPlaylistName, setInitialPlaylistName] = useState(null);
  const[playlistName, setPlaylistName] = useState("");
  const [currentPlaylistId, setCurrentPlaylistId] = useState("");

  const handleNamePlaylist = ({target}) => {
    const newPlaylistName = target.value;
    setPlaylistName(newPlaylistName);
    
    // Save the user's progress to localStorage
    localStorage.setItem("playlist_name", newPlaylistName)
  };

  const [initialPlaylist, setInitialPlaylist] = useState([]);
  
  const handleSavePlaylist = async () => {
    try {
      // Await the async Spotify.savePlaylist call
      await Spotify.savePlaylist(playlistName, userPlaylist, currentPlaylistId, initialPlaylist, initialPlaylistName);

      // Refresh searchResults
      setDisplayResults(searchResults);

      // Newly created playlist should appear in local playlists
      setPlaylistList([]);

      if (initialPlaylistName) {
        // renaming an existing playlist takes a while to be reflected
        setTimeout(async () => await handleGetUserPlaylists(), 30000)

      } else {
        await handleGetUserPlaylists();
      }
      
      handleClearPlaylist();

    } catch(error) {
      console.error("Error saving the playlist:", error);
    }
  };

  const trackButton = {
    delete: "delete",
    add: "add"
  };

  const handleClearPlaylist = () => {
    // Clear the playlist panel and id
    setInitialPlaylistName(null);
    setPlaylistName("");
    setInitialPlaylist([])
    setUserPlaylist([]);
    setCurrentPlaylistId(null);

    // clear playlist data in localStorage
    localStorage.removeItem("playlist_name");
    localStorage.removeItem("playlist_tracks");
    localStorage.removeItem("playlist_id");

    // refresh displayResults
    if (searchResults.length > 0) {
      setDisplayResults(searchResults);
    }
  }

  const handleLogout = () => {
    // Clear the playlist data in states and localStorage
    handleClearPlaylist();

    localStorage.removeItem("search_term");
  };

  // Exit app procedure
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Check if the user is being redirected for authentication
      const isAuthenticating = localStorage.getItem("isAuthenticating");

      if (isAuthenticating === "true") {
        // If the user is being redirected for authentication, do not clear the local storage
        return;
      }

      // Call the handleLogout function to clear local storage
      handleLogout();

      // Prompt the user before they leave
      const message = "Are you sure you want to leave? Your progress will be lost.";
      event.returnValue = message;
      return message;
    }

    // Attach the event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  const [playlistList, setPlaylistList] = useState([]);
  
  const handleGetUserPlaylists = async () => {
    try {
      const playlistArr = await Spotify.getUserPlaylists();
      setPlaylistList(playlistArr);
    } catch(error) {
      console.error('Error fetching user playlists:', error);
    }
  };

  const handleSelectPlaylist = async ({target}) => {
    const selectedPlaylistId = target.id;

    // Save selected playlist id in state and local storage
    setCurrentPlaylistId(selectedPlaylistId);
    localStorage.setItem("playlist_id", selectedPlaylistId);

    try {
      const [selectedPlaylistName, selectedPlaylistTracks] = await Spotify.getPlaylist(selectedPlaylistId);

      setPlaylistName(selectedPlaylistName);
      localStorage.setItem("playlist_name", selectedPlaylistName);
      // set initialUserPlaylist to see if the name changed
      setInitialPlaylistName(selectedPlaylistName);
      
      setUserPlaylist(selectedPlaylistTracks);
      const selectedPlaylistTracksJson = JSON.stringify(selectedPlaylistTracks);
      localStorage.setItem("playlist_tracks", selectedPlaylistTracksJson);

      // set initialUserPlaylist to see what changed. This helps with updating playlist
      setInitialPlaylist(selectedPlaylistTracks)

      // Make an array of track IDs from the selected playlist's tracks
      const userTrackIds = selectedPlaylistTracks.map((track) => track.id)

      // Filter tracks that are not in the selectedPlaylistTracks by comparing IDs
      const filteredTracks = searchResults.filter(
        (searchTracks) => !userTrackIds.includes(searchTracks.id))

      setDisplayResults(filteredTracks);

    } catch(error) {
      console.error('Error selecting local playlist:', error);
    }
  };

  useEffect(() => {
    //Clear the "isAuthenticating" flag after redirection
    localStorage.removeItem("isAuthenticating");
  }, []);
  
  // Starting app procedure
  useEffect(() => {
    // Check if there's a search term and playlist saved in localStorage
    const savedTerm = localStorage.getItem("search_term");
    const savedPlaylistName = localStorage.getItem("playlist_name");
    const savedPlaylistTracks = localStorage.getItem("playlist_tracks");
    const savedPlaylistId = localStorage.getItem("playlist_id");

    if (savedTerm && savedTerm !== "undefined") {

      setUserInput(savedTerm);
      // Perform the search automatically after the token is fetched.
      // Spotify.getAccessToken() need not be run here because the Spotify.search() is going to do it anyway
        try {
          const redoSearch = async () => {
            const tracksArr = await Spotify.search(savedTerm)

            setSearchResults(tracksArr);

            // Check if any of the searched songs have been added to the userPlaylist
            if(savedPlaylistTracks && savedPlaylistTracks !== "undefined") {
              const savedPlaylistTracksArr = JSON.parse(savedPlaylistTracks);

              // Create an array of track IDs from the userTracksArr
              const savedPlaylistTrackIds = savedPlaylistTracksArr.map(track => track.id)

              // Filter tracks that are not in the userTracksArr by comparing IDs
              const filteredTracks = tracksArr.filter(
                (searchTrack) => !savedPlaylistTrackIds.includes(searchTrack.id)
              );

              // Set displayResults to the filtered tracks
              setDisplayResults(filteredTracks);

            } else {
              setDisplayResults(tracksArr);
            }
            
            // Get users playlists. Delay is needed to wait for the access token to be available
            setTimeout(handleGetUserPlaylists, 1000)
          };

          redoSearch();
          
        } catch(error) {
          console.log(`Error rerunning search: ${error}`)
        }

    } else {
      const getAccessToken = async () => {
        await Spotify.getAccessToken();
      }

      getAccessToken()
      setTimeout(handleGetUserPlaylists, 1000)
    }

    if(savedPlaylistName && savedPlaylistName !== "undefined") {
      // Restores user progress on playlist name
      setPlaylistName(savedPlaylistName);
    }

    if(savedPlaylistTracks && savedPlaylistTracks !== "undefined") {
      // Restores user progress on playlist tracks
      setUserPlaylist(JSON.parse(savedPlaylistTracks));
    }

    if(savedPlaylistId && savedPlaylistId !== "undefined") {
      // Restores user progress on playlist id
      setCurrentPlaylistId(savedPlaylistId);
    }
  }, []);

  return (
    <div className={styles.viewport}>
      <div className={styles.backgroundImg}></div>
      <h1>Jammming</h1>
      <div className={styles.main}>
        <SearchBar
          userInput={userInput}
          handleSearch={handleSearch}
          handleUserInput={handleUserInput}
        />
        <div className={styles.containerPanels}>
          <SearchResults
            displayResults={displayResults}
            handleAddTrack={handleAddTrack}
            trackButton={trackButton}
            playlistList={playlistList}
            handleSelectPlaylist={handleSelectPlaylist}
          />
          <Playlist
            userPlaylist={userPlaylist}
            handleDeleteTrack={handleDeleteTrack}
            trackButton={trackButton}
            playlistName={playlistName}
            handleNamePlaylist={handleNamePlaylist}
            handleSavePlaylist={handleSavePlaylist}
            handleClearPlaylist={handleClearPlaylist}
          />
        </div>
      </div>
      <p className={styles.photoCredit} >Photo by <a className={styles.photoCreditLink} href="https://unsplash.com/@sickhews?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash" target="_blank" >Wes Hicks</a> on <a className={styles.photoCreditLink} href="https://unsplash.com/photos/several-guitars-beside-of-side-table-MEL-jJnm7RQ?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash" target="_blank" >Unsplash</a>
        </p>
    </div>
  );
};

export default App;