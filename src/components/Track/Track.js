import React from 'react';
import styles from "./Track.module.css";

function Track(props) {
    return (
        <li className={styles.track} >
            <div>
                <p className={styles.trackName} >{props.name}</p>
                <div className={styles.trackDetails} >
                    <p className={styles.trackArtist} >{props.artist}</p>
                    <p className={styles.trackDivider} >|</p>
                    <p className={styles.trackAlbum} >{props.album.name}</p>
                </div>
            </div>
            <button
                className={styles.trackButton}
                value={props.id}
                onClick={props.trackButton === "add" ? props.handleAddTrack : props.handleDeleteTrack }
            >
                {props.trackButton === "add" ? "add" : "remove"}
            </button>
        </li>
    )
};

export default Track;