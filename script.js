// ==========================================
// GET HTML ELEMENTS
// ==========================================

const folderBtn = document.getElementById("folderBtn");
const folderInput = document.getElementById("folderInput");
const selectFolderEmpty = document.getElementById("selectFolderEmpty");

const mediaGrid = document.getElementById("mediaGrid");

const searchInput = document.getElementById("searchInput");

const playerModal = document.getElementById("playerModal");

const videoPlayer = document.getElementById("videoPlayer");

const imageViewer = document.getElementById("imageViewer");

const playerTitle = document.getElementById("playerTitle");

const closePlayer = document.getElementById("closePlayer");

const recommendationList =
    document.getElementById("recommendationList");
    const belowMediaGrid =
    document.getElementById("belowMediaGrid");
    
    const previousMedia =
    document.getElementById("previousMedia");

const nextMedia =
    document.getElementById("nextMedia");

const mediaType =
    document.getElementById("mediaType");

const mediaSize =
    document.getElementById("mediaSize");

    const watchHomeBtn =
    document.getElementById("watchHomeBtn");


// Currently playing file

let currentMediaFile = null;


// ==========================================
// MEDIA DATA
// ==========================================

let mediaFiles = [];

let currentFilter = "all";


// ==========================================
// OPEN FOLDER PICKER
// ==========================================

// ==========================================
// FOLDER PICKER
// ==========================================

const LAST_FOLDER_DB = "LocalTubeFolderDB";
const LAST_FOLDER_STORE = "folderStore";
const LAST_FOLDER_KEY = "lastFolder";


// ==========================================
// OPEN DATABASE
// ==========================================

function openFolderDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            LAST_FOLDER_DB,
            1
        );

        request.onupgradeneeded = function (event) {

            const db = event.target.result;

            if (!db.objectStoreNames.contains(LAST_FOLDER_STORE)) {

                db.createObjectStore(
                    LAST_FOLDER_STORE
                );

            }

        };

        request.onsuccess = function () {

            resolve(request.result);

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// ==========================================
// SAVE FOLDER HANDLE
// ==========================================

async function saveFolderHandle(handle) {

    try {

        const db =
            await openFolderDatabase();

        const transaction =
            db.transaction(
                LAST_FOLDER_STORE,
                "readwrite"
            );

        transaction
            .objectStore(LAST_FOLDER_STORE)
            .put(
                handle,
                LAST_FOLDER_KEY
            );

    } catch (error) {

        console.log(
            "Could not save folder:",
            error
        );

    }

}


// ==========================================
// GET SAVED FOLDER HANDLE
// ==========================================

async function getSavedFolderHandle() {

    try {

        const db =
            await openFolderDatabase();

        return new Promise((resolve, reject) => {

            const transaction =
                db.transaction(
                    LAST_FOLDER_STORE,
                    "readonly"
                );

            const request =
                transaction
                    .objectStore(LAST_FOLDER_STORE)
                    .get(LAST_FOLDER_KEY);

            request.onsuccess = function () {

                resolve(
                    request.result || null
                );

            };

            request.onerror = function () {

                reject(request.error);

            };

        });

    } catch (error) {

        console.log(
            "Could not get saved folder:",
            error
        );

        return null;

    }

}


// ==========================================
// READ ALL FILES FROM FOLDER
// ==========================================

async function readFolderFiles(folderHandle) {

    const files = [];


    async function readDirectory(directory) {

        for await (
            const entry of directory.values()
        ) {

            if (entry.kind === "file") {

                try {

                    const file =
                        await entry.getFile();

                    if (
                        file.type.startsWith("video/") ||
                        file.type.startsWith("image/")
                    ) {

                        files.push(file);

                    }

                } catch (error) {

                    console.log(
                        "File read error:",
                        error
                    );

                }

            }


            else if (
                entry.kind === "directory"
            ) {

                await readDirectory(entry);

            }

        }

    }


    await readDirectory(folderHandle);

    return files;

}


// ==========================================
// SELECT FOLDER
// ==========================================

async function chooseFolder() {

    // Modern browser support
    if (
        "showDirectoryPicker" in window
    ) {

        try {

            const folderHandle =
                await window.showDirectoryPicker({
                    mode: "read"
                });


            // Request permission
            const permission =
                await folderHandle.requestPermission({
                    mode: "read"
                });


            if (
                permission !== "granted"
            ) {

                return;

            }


            // Save folder
            await saveFolderHandle(
                folderHandle
            );


            // Read files
            const files =
                await readFolderFiles(
                    folderHandle
                );


            mediaFiles = files;


            console.log(
                "Folder:",
                folderHandle.name
            );

            console.log(
                "Media files:",
                mediaFiles
            );


            showMedia();


        }

        catch (error) {

            if (
                error.name === "AbortError"
            ) {

                return;

            }


            console.log(
                "Folder picker error:",
                error
            );

        }

    }

    else {

        // Old browser fallback
        folderInput.click();

    }

}


// ==========================================
// BUTTONS
// ==========================================

folderBtn.addEventListener(
    "click",
    chooseFolder
);


selectFolderEmpty.addEventListener(
    "click",
    chooseFolder
);


selectFolderEmpty.addEventListener("click", function () {

    folderInput.click();

});


// ==========================================
// FOLDER SELECTED
// ==========================================

folderInput.addEventListener(
    "change",
    function (event) {

        const files =
            Array.from(
                event.target.files
            );


        mediaFiles =
            files.filter(function (file) {

                return (
                    file.type.startsWith("video/") ||
                    file.type.startsWith("image/")
                );

            });


        console.log(
            "Media files:",
            mediaFiles
        );


        showMedia();


        // Same folder ko dobara select karne ki permission
        folderInput.value = "";

    }
);


// ==========================================
// SHOW MEDIA
// ==========================================

function showMedia() {

    mediaGrid.innerHTML = "";


    let filteredFiles =
        mediaFiles.filter(function (file) {


            if (currentFilter === "video") {

                return file.type.startsWith("video/");

            }


            if (currentFilter === "image") {

                return file.type.startsWith("image/");

            }


            return true;

        });


    // ======================================
    // SEARCH
    // ======================================

    const searchText =
        searchInput.value.toLowerCase().trim();


    if (searchText !== "") {

        filteredFiles =
            filteredFiles.filter(function (file) {

                return file.name
                    .toLowerCase()
                    .includes(searchText);

            });

    }


    // ======================================
    // NO MEDIA
    // ======================================

    if (filteredFiles.length === 0) {

        mediaGrid.innerHTML = `
            <div class="empty-message">

                <div class="empty-icon">
                    😕
                </div>

                <h2>No media found</h2>

                <p>
                    Try another search or select another folder.
                </p>

            </div>
        `;

        return;

    }


    // ======================================
    // CREATE CARDS
    // ======================================

    filteredFiles.forEach(function (file) {

        createMediaCard(file);

    });

}


// ==========================================
// CREATE MEDIA CARD
// ==========================================

function createMediaCard(file) {

    const card =
        document.createElement("div");

    card.className = "media-card";


    const thumbnail =
        document.createElement("div");

    thumbnail.className = "thumbnail";


    const url =
        URL.createObjectURL(file);


    // ======================================
    // VIDEO
    // ======================================

    if (file.type.startsWith("video/")) {

        const video =
            document.createElement("video");


        video.src = url;

        video.muted = true;

        video.playsInline = true;

        video.preload = "metadata";


        video.className = "preview-video";


        thumbnail.appendChild(video);


        // Preview label
        const icon =
            document.createElement("div");

        icon.className = "preview-play";

        icon.innerText = "▶ Preview";

        thumbnail.appendChild(icon);


        // ==================================
        // MOUSE ENTER
        // ==================================

        card.addEventListener("mouseenter", function () {

            // Start from beginning
            video.currentTime = 0;


            video.play().catch(function () {

                // Browser autoplay restriction
                console.log("Preview autoplay blocked");

            });

        });


        // ==================================
        // MOUSE LEAVE
        // ==================================

        card.addEventListener("mouseleave", function () {

            video.pause();

            video.currentTime = 0;

        });

    }


    // ======================================
    // IMAGE
    // ======================================

    else {

        const image =
            document.createElement("img");


        image.src = url;

        image.alt = file.name;


        thumbnail.appendChild(image);


        const icon =
            document.createElement("div");


        icon.className = "image-icon";

        icon.innerText = "🖼 Image";


        thumbnail.appendChild(icon);

    }


    // ======================================
    // TITLE
    // ======================================

    const title =
        document.createElement("div");


    title.className = "media-title";

    title.innerText = file.name;


    // ======================================
    // FILE SIZE
    // ======================================

    const info =
        document.createElement("div");


    info.className = "media-info";


    const sizeMB =
        (file.size / (1024 * 1024)).toFixed(1);


    info.innerText =
        sizeMB + " MB";


    // ======================================
    // ADD TO CARD
    // ======================================

    card.appendChild(thumbnail);

    card.appendChild(title);

    card.appendChild(info);


    // ======================================
    // OPEN VIDEO
    // ======================================

    card.addEventListener("click", function () {

        openMedia(file);
        

    });


    mediaGrid.appendChild(card);

}


// ==========================================
// OPEN MEDIA
// ==========================================

function openMedia(file) {

    currentMediaFile = file;


    const url =
        URL.createObjectURL(file);


    playerModal.classList.add("show");

// Hide browser scrollbar while watching
document.body.classList.add("watching-media");


    // File name

    playerTitle.innerText =
        file.name;


    // File size

    const sizeMB =
        (file.size / (1024 * 1024)).toFixed(1);


    mediaSize.innerText =
        sizeMB + " MB";


    // ======================================
    // VIDEO
    // ======================================

    if (file.type.startsWith("video/")) {

        mediaType.innerText =
            "🎬 Video";


        imageViewer.style.display =
            "none";


        videoPlayer.style.display =
            "block";


        videoPlayer.src =
            url;


        videoPlayer.muted =
            false;


        videoPlayer.play();


    }


    // ======================================
    // IMAGE
    // ======================================

    else {

        mediaType.innerText =
            "🖼 Image";


        videoPlayer.pause();


        videoPlayer.removeAttribute("src");


        videoPlayer.style.display =
            "none";


        imageViewer.style.display =
            "block";


        imageViewer.src =
            url;

    }


    // ======================================
    // RECOMMENDATIONS
    // ======================================

    showRecommendations(file);
    showMoreMedia(file);

}


// ==========================================
// RECOMMENDATIONS
// ==========================================

function showRecommendations(currentFile) {

    recommendationList.innerHTML = "";


    // Current video ko recommendation mein nahi dikhana
    const recommendations =
        mediaFiles.filter(function (file) {

            return file !== currentFile;

        });


    // Maximum 10 recommendations
    const limited =
        recommendations.slice(0, 10);


    limited.forEach(function (file) {

        createRecommendation(file);

    });


    if (limited.length === 0) {

        recommendationList.innerHTML = `
            <p style="color:#aaa;">
                No more media available.
            </p>
        `;

    }

}


// ==========================================
// CREATE RECOMMENDATION
// ==========================================

function createRecommendation(file) {

    const card =
        document.createElement("div");


    card.className =
        "recommendation-card";


    const thumbnail =
        document.createElement("div");


    thumbnail.className =
        "recommendation-thumbnail";


    const url =
        URL.createObjectURL(file);


    // ======================================
    // VIDEO
    // ======================================
if (file.type.startsWith("video/")) {

    const video =
        document.createElement("video");

    video.src = url;

    video.muted = true;

    video.playsInline = true;

    video.preload = "metadata";

    video.setAttribute("webkit-playsinline", "");

    thumbnail.appendChild(video);


    // ==============================
    // HOVER PREVIEW START
    // ==============================

    card.addEventListener("mouseenter", function () {

        video.currentTime = 0;

        video.play().catch(function () {

            console.log("Recommendation preview blocked");

        });

    });


    // ==============================
    // HOVER PREVIEW STOP
    // ==============================

    card.addEventListener("mouseleave", function () {

        video.pause();

        video.currentTime = 0;

    });

}


    // ======================================
    // IMAGE
    // ======================================

    else {

        const image =
            document.createElement("img");


        image.src = url;

        image.alt = file.name;


        thumbnail.appendChild(image);

    }


    // ======================================
    // INFO
    // ======================================

    const info =
        document.createElement("div");


    info.className =
        "recommendation-info";


    const title =
        document.createElement("div");


    title.className =
        "recommendation-title";


    title.innerText =
        file.name;


    const size =
        document.createElement("div");


    size.className =
        "recommendation-size";


    const sizeMB =
        (file.size / (1024 * 1024)).toFixed(1);


    size.innerText =
        sizeMB + " MB";


    info.appendChild(title);

    info.appendChild(size);


    // ======================================
    // ADD TO CARD
    // ======================================

    card.appendChild(thumbnail);

    card.appendChild(info);


    // ======================================
    // CLICK RECOMMENDATION
    // ======================================

    card.addEventListener("click", function () {

        openMedia(file);

    });


    recommendationList.appendChild(card);

}


// ==========================================
// CLOSE PLAYER
// ==========================================

closePlayer.addEventListener("click", function () {

    closePlayerWindow();

});


function closePlayerWindow() {

    videoPlayer.pause();

    videoPlayer.removeAttribute("src");
    videoPlayer.load();

    imageViewer.removeAttribute("src");

    playerModal.classList.remove("show");

    // Show scrollbar again
    document.body.classList.remove("watching-media");

}


// ==========================================
// CLICK OUTSIDE
// ==========================================

playerModal.addEventListener("click", function (event) {

    if (event.target === playerModal) {

        closePlayerWindow();

    }

});


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener("input", function () {

    showMedia();

});


// ==========================================
// FILTER BUTTONS
// ==========================================

const filters =
    document.querySelectorAll(".filter");


filters.forEach(function (button) {

    button.addEventListener("click", function () {


        filters.forEach(function (btn) {

            btn.classList.remove("active");

        });


        button.classList.add("active");


        currentFilter =
            button.dataset.filter;


        showMedia();

    });

});


// ==========================================
// SIDEBAR - VIDEOS
// ==========================================

document
    .getElementById("videosFilter")
    .addEventListener("click", function () {

        currentFilter = "video";

        updateFilterButtons();

        showMedia();

    });


// ==========================================
// SIDEBAR - IMAGES
// ==========================================

document
    .getElementById("imagesFilter")
    .addEventListener("click", function () {

        currentFilter = "image";

        updateFilterButtons();

        showMedia();

    });


// ==========================================
// SIDEBAR - ALL
// ==========================================

document
    .getElementById("allFilter")
    .addEventListener("click", function () {

        currentFilter = "all";

        updateFilterButtons();

        showMedia();

    });


// ==========================================
// UPDATE FILTER BUTTONS
// ==========================================

function updateFilterButtons() {

    filters.forEach(function (button) {

        button.classList.remove("active");


        if (
            button.dataset.filter === currentFilter
        ) {

            button.classList.add("active");

        }

    });

}
// ==========================================
// GET PREVIOUS / NEXT MEDIA
// ==========================================

function getSameTypeMedia() {

    if (!currentMediaFile) {

        return [];

    }


    // If current media is video
    if (
        currentMediaFile.type.startsWith("video/")
    ) {

        return mediaFiles.filter(function (file) {

            return file.type.startsWith("video/");

        });

    }


    // If current media is image
    return mediaFiles.filter(function (file) {

        return file.type.startsWith("image/");

    });

}


// ==========================================
// NEXT MEDIA
// ==========================================

function nextMediaFile() {

    const list =
        getSameTypeMedia();


    if (list.length === 0) {

        return;

    }


    const currentIndex =
        list.indexOf(currentMediaFile);


    let nextIndex =
        currentIndex + 1;


    // If last file → first file
    if (nextIndex >= list.length) {

        nextIndex = 0;

    }


    openMedia(list[nextIndex]);

}


// ==========================================
// PREVIOUS MEDIA
// ==========================================

function previousMediaFile() {

    const list =
        getSameTypeMedia();


    if (list.length === 0) {

        return;

    }


    const currentIndex =
        list.indexOf(currentMediaFile);


    let previousIndex =
        currentIndex - 1;


    // If first file → last file
    if (previousIndex < 0) {

        previousIndex =
            list.length - 1;

    }


    openMedia(list[previousIndex]);

}


// ==========================================
// NEXT BUTTON
// ==========================================

nextMedia.addEventListener(
    "click",
    function () {

        nextMediaFile();

    }
);


// ==========================================
// PREVIOUS BUTTON
// ==========================================

previousMedia.addEventListener(
    "click",
    function () {

        previousMediaFile();

    }
);

// ==========================================
// KEYBOARD CONTROLS
// ==========================================

document.addEventListener(
    "keydown",
    function (event) {

        // Player open nahi hai
        if (
            !playerModal.classList.contains("show")
        ) {
            return;
        }


        // ==================================
        // INPUT / TEXTAREA
        // ==================================

        if (
            event.target.tagName === "INPUT" ||
            event.target.tagName === "TEXTAREA"
        ) {
            return;
        }


        // ==================================
        // SPACE = PLAY / PAUSE
        // ==================================

        if (event.code === "Space") {

            if (
                currentMediaFile &&
                currentMediaFile.type.startsWith("video/")
            ) {

                event.preventDefault();

                if (videoPlayer.paused) {

                    videoPlayer.play();

                } else {

                    videoPlayer.pause();

                }

            }

        }


        // ==================================
        // J = 10 SEC BACKWARD
        // ==================================

        else if (
            event.key.toLowerCase() === "j"
        ) {

            if (
                currentMediaFile &&
                currentMediaFile.type.startsWith("video/")
            ) {

                event.preventDefault();

                videoPlayer.currentTime =
                    Math.max(
                        0,
                        videoPlayer.currentTime - 10
                    );

            }

        }


        // ==================================
        // L = 10 SEC FORWARD
        // ==================================

        else if (
            event.key.toLowerCase() === "l"
        ) {

            if (
                currentMediaFile &&
                currentMediaFile.type.startsWith("video/")
            ) {

                event.preventDefault();

                videoPlayer.currentTime =
                    Math.min(
                        videoPlayer.duration || Infinity,
                        videoPlayer.currentTime + 10
                    );

            }

        }


        // ==================================
        // LEFT ARROW = PREVIOUS
        // ==================================

        else if (
            event.key === "ArrowLeft"
        ) {

            event.preventDefault();

            previousMediaFile();

        }


        // ==================================
        // RIGHT ARROW = NEXT
        // ==================================

        else if (
            event.key === "ArrowRight"
        ) {

            event.preventDefault();

            nextMediaFile();

        }


        // ==================================
        // UP ARROW = SCROLL UP
        // ==================================

        else if (
            event.key === "ArrowUp"
        ) {

            event.preventDefault();

            playerModal.scrollBy({
                top: -400,
                behavior: "smooth"
            });

        }


        // ==================================
        // DOWN ARROW = SCROLL DOWN
        // ==================================

        else if (
            event.key === "ArrowDown"
        ) {

            event.preventDefault();

            playerModal.scrollBy({
                top: 400,
                behavior: "smooth"
            });

        }


        // ==================================
        // F = FULLSCREEN
        // ==================================

        else if (
            event.key.toLowerCase() === "f"
        ) {

            event.preventDefault();

            toggleFullscreen();

        }

    }
);




// ==========================================
// MORE MEDIA BELOW PLAYER
// ==========================================

function showMoreMedia(currentFile) {

    belowMediaGrid.innerHTML = "";


    // Current file ko hata kar baaki media
    const otherFiles =
        mediaFiles.filter(function (file) {

            return file !== currentFile;

        });


    // Maximum 20 files
    const filesToShow =
        otherFiles.slice(0, 20);


    filesToShow.forEach(function (file) {

        createBelowMediaCard(file);

    });



}

// ==========================================
// CREATE BELOW MEDIA CARD
// ==========================================

function createBelowMediaCard(file) {

    const card =
        document.createElement("div");


    card.className =
        "below-media-card";


    const thumbnail =
        document.createElement("div");


    thumbnail.className =
        "below-media-thumbnail";


    const url =
        URL.createObjectURL(file);


    // ======================================
    // VIDEO
    // ======================================

 if (file.type.startsWith("video/")) {

    const video =
        document.createElement("video");

    video.src = url;

    video.muted = true;

    video.playsInline = true;

    video.preload = "metadata";

    video.setAttribute("webkit-playsinline", "");

    thumbnail.appendChild(video);


    // ==============================
    // HOVER PREVIEW START
    // ==============================

    card.addEventListener("mouseenter", function () {

        video.currentTime = 0;

        video.play().catch(function () {

            console.log("Recommendation preview blocked");

        });

    });


    // ==============================
    // HOVER PREVIEW STOP
    // ==============================

    card.addEventListener("mouseleave", function () {

        video.pause();

        video.currentTime = 0;

    });

}

    // ======================================
    // IMAGE
    // ======================================

    else {

        const image =
            document.createElement("img");


        image.src = url;

        image.alt = file.name;


        thumbnail.appendChild(image);

    }


    // ======================================
    // TITLE
    // ======================================

    const title =
        document.createElement("div");


    title.className =
        "below-media-title";


    title.innerText =
        file.name;


    // ======================================
    // SIZE
    // ======================================

    const info =
        document.createElement("div");


    info.className =
        "below-media-info";


    const sizeMB =
        (file.size / (1024 * 1024)).toFixed(1);


    if (file.type.startsWith("video/")) {

        info.innerText =
            "🎬 Video • " + sizeMB + " MB";

    } else {

        info.innerText =
            "🖼 Image • " + sizeMB + " MB";

    }


    // ======================================
    // ADD
    // ======================================

    card.appendChild(thumbnail);

    card.appendChild(title);

    card.appendChild(info);


    // ======================================
    // CLICK
    // ======================================

    card.addEventListener(
        "click",
        function () {

            openMedia(file);

        }
    );


    belowMediaGrid.appendChild(card);

}

// ==========================================
// WATCH PAGE LOGO → HOME
// ==========================================

watchHomeBtn.addEventListener(
    "click",
    function () {

        closePlayerWindow();

    }
);

// ==========================================
// FULLSCREEN TOGGLE
// ==========================================

function toggleFullscreen() {

    let fullscreenElement;


    // ==============================
    // VIDEO
    // ==============================

    if (
        currentMediaFile &&
        currentMediaFile.type.startsWith("video/")
    ) {

        fullscreenElement = videoPlayer;

    }


    // ==============================
    // IMAGE
    // ==============================

    else if (
        currentMediaFile &&
        currentMediaFile.type.startsWith("image/")
    ) {

        fullscreenElement = imageViewer;

    }


    // Koi media open nahi
    if (!fullscreenElement) {

        return;

    }


    // ==============================
    // FULLSCREEN ON
    // ==============================

    if (!document.fullscreenElement) {

        fullscreenElement
            .requestFullscreen()
            .catch(function (error) {

                console.log(
                    "Fullscreen error:",
                    error
                );

            });

    }


    // ==============================
    // FULLSCREEN OFF
    // ==============================

    else {

        document.exitFullscreen();

    }

}

// ==========================================
// RESTORE LAST FOLDER
// ==========================================

async function restoreLastFolder() {

    if (
        !("showDirectoryPicker" in window)
    ) {

        return;

    }


    try {

        const folderHandle =
            await getSavedFolderHandle();


        if (!folderHandle) {

            return;

        }


        // Check saved permission
        const permission =
            await folderHandle.queryPermission({
                mode: "read"
            });


        if (
            permission !== "granted"
        ) {

            console.log(
                "Folder permission required."
            );

            return;

        }


        // Read folder again
        const files =
            await readFolderFiles(
                folderHandle
            );


        if (
            files.length === 0
        ) {

            return;

        }


        mediaFiles = files;


        console.log(
            "Last folder restored:",
            folderHandle.name
        );


        showMedia();

    }

    catch (error) {

        console.log(
            "Could not restore folder:",
            error
        );

    }

}


// ==========================================
// START RESTORE
// ==========================================

restoreLastFolder();