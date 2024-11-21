import React from "react";
import PlaylistListItem from "../PlaylistListItem/PlaylistListItem";
import styles from "./PlaylistList.module.css";

function PlaylistList({ playlistList, handleSelectPlaylist }) {
    return (
        <ul className={styles.ulTracklist} >
            {playlistList.length > 0 ? (
                playlistList.map((playlist) => (
                <PlaylistListItem
                    key={playlist.playlistId}
                    id={playlist.playlistId}
                    name={playlist.name}
                    handleSelectPlaylist={handleSelectPlaylist}
                /> 
            ))) : (
                <p>Loading playlists...</p>
            )
            }
        </ul>
    );
};

export default PlaylistList