import React from 'react';
import Tracklist from "../Tracklist/Tracklist"
import styles from "./Playlist.module.css";

function Playlist({ userPlaylist, handleDeleteTrack, trackButton, playlistName, handleNamePlaylist, handleSavePlaylist, handleClearPlaylist }) {
    return (
        <div className={styles.panel} >
            <input className={styles.h2} id="Playlist-Name" value={playlistName} onChange={handleNamePlaylist} placeholder="Your Playlist Name"/>
            <Tracklist
                tracks={userPlaylist}
                handleDeleteTrack={handleDeleteTrack}
                trackButton={trackButton.delete}
            />
            <div className={styles.buttons} >
                <button className={styles.clearButton} onClick={handleClearPlaylist} >Clear Playlist</button>
                <button className={styles.saveButton} onClick={handleSavePlaylist} value={playlistName} >Save Playlist</button>
            </div>
            
        </div>
    )
};

export default Playlist;