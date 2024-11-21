import React from 'react';
import Tracklist from "../Tracklist/Tracklist";
import PlaylistList from "../PlaylistList/PlaylistList";
import styles from "./SearchResults.module.css";

function SearchResults({ displayResults, handleAddTrack, trackButton, playlistList, handleSelectPlaylist }) {
    return (
        <div className={styles.panel}>
            <div className={styles.searchResults} >
                <h2 className={styles.h2} >Search Results</h2>
                <Tracklist
                    tracks={displayResults}
                    handleAddTrack={handleAddTrack}
                    trackButton={trackButton.add}
                />
            </div>
            <div className={styles.yourPlaylists} >
                <h2 className={styles.h2} >Your Playlists</h2>
                <PlaylistList
                    playlistList={playlistList}
                    handleSelectPlaylist={handleSelectPlaylist}
                />
            </div>
        </div>
    )
};

export default SearchResults;