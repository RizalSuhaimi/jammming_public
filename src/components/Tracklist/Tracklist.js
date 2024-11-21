import React from 'react';
import Track from "../Track/Track";
import styles from "./Tracklist.module.css";

function Tracklist({ tracks, handleAddTrack, handleDeleteTrack, trackButton, }) {
    return (
        <ul className={styles.ulTracklist} >
            {tracks.map((track) => (
                <Track
                    key={track.id}
                    id={track.id}
                    name={track.name}
                    artist={track.artist}
                    album={track.album}
                    trackButton={trackButton}
                    handleAddTrack={handleAddTrack}
                    handleDeleteTrack={handleDeleteTrack}
                />
            ))}
        </ul>
    )
};

export default Tracklist;