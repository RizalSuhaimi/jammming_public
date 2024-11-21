import React from 'react';
import styles from "./PlaylistListItem.module.css";

function PlaylistListItem({ id, name, handleSelectPlaylist }) {
    return (
        <li className={styles.playlist} id={id} onClick={handleSelectPlaylist} >
            {name}
        </li>
    )
}

export default PlaylistListItem;