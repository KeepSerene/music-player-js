// Import CSS modules
import "../css/style.css";
import "../css/header.css";
import "../css/musicPlayer.css";
import "../css/playlist.css";
import "../css/utils.css";

// Import JS modules
import musicData from "./musicData.js";

/**
 * Attaches an event listener to each element in a collection of elements.
 *
 * @param {HTMLElement[]} elements - The collection of elements to attach the event listeners to.
 * @param {string} eventType - The type of event to listen for (e.g., 'click', 'mouseover').
 * @param {Function} callback - The callback function to execute when the event is triggered.
 */

const attachEventListenersToElems = (elements, eventType, callback) =>
  elements.forEach((elem) => elem.addEventListener(eventType, callback));

// Load all the music tracks into the playlist
const musicTracksEl = document.querySelector("[data-music-tracks]");

for (let i = 0, len = musicData.length; i < len; i++) {
  musicTracksEl.innerHTML += `
    <li>
        <button
        type="button"
        class="music-track ${i === 0 ? "playing" : ""}"
        data-playlist-toggler
        data-music-track="${i}"
        >
            <img
                src="${musicData[i].posterUrl}"
                width="800"
                height="800"
                class="thumbnail"
                alt="${musicData[i].title} Album Poster"
            />

            <div class="icon-item">
                <i class="material-symbols-rounded">equalizer</i>
            </div>
        </button>
    </li>
    `;
}

// Toggle the playlist modal window
const playListTogglerEls = document.querySelectorAll("[data-playlist-toggler]");
const playList = document.querySelector("[data-playlist]");
const overlayEl = document.querySelector("[data-overlay]");

function togglePlaylist() {
  document.body.classList.toggle("modal-active");
  playList.classList.toggle("active");
  overlayEl.classList.toggle("active");
}

attachEventListenersToElems(playListTogglerEls, "click", togglePlaylist);

// Remove the "playing" class from the previously playing music track and add it to the currently one
const musicTrackEls = musicTracksEl.querySelectorAll("[data-music-track]");

let currentTrackIndex = 0;
let previousTrackIndex = 0;

function switchMusicTrack() {
  musicTrackEls[previousTrackIndex].classList.remove("playing");
  musicTrackEls[currentTrackIndex].classList.add("playing");
}

attachEventListenersToElems(musicTrackEls, "click", function () {
  previousTrackIndex = currentTrackIndex;
  currentTrackIndex = Number(this.dataset.musicTrack);

  switchMusicTrack();
});

// Update the music player based on the current music track
const musicPlayerThumbnailEl = document.querySelector("[data-thumbnail]");
const musicTitleEl = document.querySelector("[data-music-title]");
const musicAlbumEl = document.querySelector("[data-music-album]");
const yearEl = document.querySelector("[data-year]");
const artistEl = document.querySelector("[data-artist]");

// Initialize an audio object
const audio = new Audio(musicData[currentTrackIndex].musicPath);

function updateMusicPlayer() {
  const currentMusicTrack = musicData[currentTrackIndex];

  musicPlayerThumbnailEl.src = currentMusicTrack.posterUrl;
  musicPlayerThumbnailEl.setAttribute(
    "alt",
    `${currentMusicTrack.title} Album Poster`
  );
  document.body.style.backgroundImage = `url(${currentMusicTrack.backgroundImage})`;
  musicTitleEl.innerText = currentMusicTrack.title;
  musicAlbumEl.innerText = currentMusicTrack.album;
  yearEl.innerText = currentMusicTrack.year;
  artistEl.innerText = currentMusicTrack.artist;

  audio.src = currentMusicTrack.musicPath;
  audio.addEventListener("loadeddata", updateTrackDuration);
  playMusic();
}

attachEventListenersToElems(musicTrackEls, "click", updateMusicPlayer);

// Update music player progress bar and duration timestamp
const musicProgressBarEl = document.querySelector("[data-progress-bar]");
const musicDurationEl = document.querySelector("[data-total-duration]");

function formatTimestamp(duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.ceil(duration - minutes * 60);
  const timestamp = `${minutes} : ${seconds < 10 ? "0" : ""}${seconds}`;

  return timestamp;
}

function updateTrackDuration() {
  musicProgressBarEl.max = Math.ceil(audio.duration);
  musicDurationEl.innerText = formatTimestamp(Number(musicProgressBarEl.max));
}

audio.addEventListener("loadeddata", updateTrackDuration);

// Play and pause a music track
const playBtnEl = document.querySelector("[data-play-btn]");

let musicPlayingInterval;

function playMusic() {
  if (audio.paused) {
    audio.play();
    playBtnEl.classList.add("active");
    musicPlayingInterval = setInterval(updateElapsedTime, 500);
  } else {
    audio.pause();
    playBtnEl.classList.remove("active");
    clearInterval(musicPlayingInterval);
  }
}

playBtnEl.addEventListener("click", playMusic);

// Update elapsed time
const elapsedTimeEl = document.querySelector("[data-elapsed-time]");

function updateElapsedTime() {
  musicProgressBarEl.value = audio.currentTime;
  elapsedTimeEl.innerText = formatTimestamp(Number(musicProgressBarEl.value));

  updateProgressBar();
  handleTrackEnd();
}

// Update the music progress bar (the progress fill)
const progressBarEls = document.querySelectorAll("[data-progress-bar]");
const musicProgressBarFillEl = document.querySelector("[data-progress-fill]");

function updateProgressBar() {
  let targetElem = this || progressBarEls[0];

  const rangeValue = (targetElem.value / targetElem.max) * 100;
  targetElem.nextElementSibling.nextElementSibling.style.width = `${rangeValue}%`;
}

attachEventListenersToElems(progressBarEls, "input", updateProgressBar);

// Skip to specific parts of a music track
function seek() {
  audio.currentTime = musicProgressBarEl.value;
  elapsedTimeEl.innerText = formatTimestamp(audio.currentTime);
}

musicProgressBarEl.addEventListener("input", seek);

// Check if a music track has ended
function handleTrackEnd() {
  if (audio.ended) {
    playBtnEl.classList.remove("active");
    audio.currentTime = 0;
    musicProgressBarEl.value = audio.currentTime;
    elapsedTimeEl.innerText = formatTimestamp(audio.currentTime);
    updateProgressBar();
  }
}

// Skip to the next music track
const skipToNextTrackBtnEl = document.querySelector("[data-skip-to-next-btn]");

function skipToNextTrack() {
  previousTrackIndex = currentTrackIndex;

  if (shouldShuffle) getRandomTrackIndex();
  else {
    currentTrackIndex >= musicData.length - 1
      ? (currentTrackIndex = 0)
      : currentTrackIndex++;
  }

  switchMusicTrack();
  updateMusicPlayer();
}

skipToNextTrackBtnEl.addEventListener("click", skipToNextTrack);

// Skip to the previous music track
const skipToPrevTrackBtnEl = document.querySelector(
  "[data-skip-to-previous-btn]"
);

function skipToPrevTrack() {
  previousTrackIndex = currentTrackIndex;

  if (shouldShuffle) getRandomTrackIndex();
  else {
    currentTrackIndex <= 0
      ? (currentTrackIndex = musicData.length - 1)
      : currentTrackIndex--;
  }

  switchMusicTrack();
  updateMusicPlayer();
}

skipToPrevTrackBtnEl.addEventListener("click", skipToPrevTrack);

// Shuffle tracks
const shuffleBtnEl = document.querySelector("[data-shuffle-btn]");

function getRandomTrackIndex() {
  const randomIndex = Math.trunc(Math.random() * musicData.length);
  currentTrackIndex = randomIndex;
}

let shouldShuffle = false;

function shuffle() {
  shuffleBtnEl.classList.toggle("active");
  shouldShuffle = !shouldShuffle;
}

shuffleBtnEl.addEventListener("click", shuffle);

// Repeat a track
const repeatTrackBtnEl = document.querySelector("[data-repeat-btn]");

function repeatTrack() {
  if (!audio.loop) {
    audio.loop = true;
    this.classList.add("active");
  } else {
    audio.loop = false;
    this.classList.remove("active");
  }
}

repeatTrackBtnEl.addEventListener("click", repeatTrack);

// Handle music volume on bigger screens
const volumeBtnEl = document.querySelector("[data-volume-btn]");
const volumeBarEl = document.querySelector("[data-volume-bar]");

function adjustVolume() {
  audio.volume = volumeBarEl.value;
  audio.muted = false;

  if (audio.volume <= 0.1) {
    volumeBtnEl.children[0].innerText = "volume_mute";
  } else if (audio.volume <= 0.5) {
    volumeBtnEl.children[0].innerText = "volume_down";
  } else {
    volumeBtnEl.children[0].innerText = "volume_up";
  }
}

volumeBarEl.addEventListener("input", adjustVolume);

// Mute a music track
function muteTrack() {
  if (!audio.muted) {
    audio.muted = true;
    volumeBtnEl.children[0].innerText = "volume_off";
  } else adjustVolume();
}

volumeBtnEl.addEventListener("click", muteTrack);
