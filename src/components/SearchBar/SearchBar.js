import React from 'react';
import styles from "./SearchBar.module.css";

function SearchBar({ userInput, handleSearch, handleUserInput }) {
    return (
        <div className={styles.divSearchBar}>
            <form className={styles.divSearchBarForm} onSubmit={handleSearch} >
                <input
                    type="text"
                    className={styles.searchBox}
                    placeholder="search for a song/artist/album"
                    value={userInput}
                    onChange={handleUserInput}
                />
                <input className={styles.searchButton} type="submit" value="search" />
            </form>
        </div>
    )
};

export default SearchBar;