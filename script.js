
// ==========================================
// LOCAL TUBE - MAIN JAVASCRIPT
// ==========================================


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

const mediaType =
    document.getElementById("mediaType");

const mediaSize =
    document.getElementById("mediaSize");

const watchHomeBtn =
    document.getElementById("watchHomeBtn");
const rotateVideoBtn =
    document.getElementById("rotateVideoBtn");


// ==========================================
// MEDIA STATE
// ==========================================

let mediaFiles = [];

let currentMediaFile = null;

let currentFilter = "all";

let videoRotation = 0;




// ==========================================
// OBJECT URL MANAGEMENT
// ==========================================

// Saare temporary object URLs yahan store honge.
// Isse unnecessary memory usage control hota hai.

const objectUrls = new Set();


function createMediaURL(file) {

    const url = URL.createObjectURL(file);

    objectUrls.add(url);

    return url;

}


function revokeMediaURL(url) {

    if (!url) {
        return;
    }

    if (objectUrls.has(url)) {

        URL.revokeObjectURL(url);

        objectUrls.delete(url);

    }

}












// ==========================================
// READ ALL MEDIA FILES
// ==========================================

async function readFolderFiles(folderHandle) {

    const files = [];


    async function readDirectory(directory) {

        for await (
            const entry of directory.values()
        ) {

            // ==================================
            // FILE
            // ==================================

            if (
                entry.kind === "file"
            ) {

                try {

                    const file =
                        await entry.getFile();


                    const isVideo =
                        file.type.startsWith(
                            "video/"
                        );


                    const isImage =
                        file.type.startsWith(
                            "image/"
                        );


                    if (
                        isVideo ||
                        isImage
                    ) {

                        files.push(file);

                    }

                }

                catch (error) {

                    console.warn(
                        "File read error:",
                        entry.name,
                        error
                    );

                }

            }


            // ==================================
            // SUB-FOLDER
            // ==================================

            else if (
                entry.kind === "directory"
            ) {

                try {

                    await readDirectory(
                        entry
                    );

                }

                catch (error) {

                    console.warn(
                        "Directory read error:",
                        entry.name,
                        error
                    );

                }

            }

        }

    }


    await readDirectory(
        folderHandle
    );


    return files;

}


// ==========================================
// SELECT FOLDER
// ==========================================

async function chooseFolder() {

    // ======================================
    // MODERN BROWSER
    // ======================================

    if (
        "showDirectoryPicker" in window
    ) {

        try {

            const folderHandle =
                await window.showDirectoryPicker({
                    mode: "read"
                });


            // ==================================
            // REQUEST PERMISSION
            // ==================================

            const permission =
                await folderHandle.requestPermission({
                    mode: "read"
                });


            if (
                permission !== "granted"
            ) {

                console.log(
                    "Folder permission denied."
                );

                return;

            }


          


            // ==================================
            // READ MEDIA
            // ==================================

            const files =
                await readFolderFiles(
                    folderHandle
                );


            mediaFiles =
                files;


            console.log(
                "Opened folder:",
                folderHandle.name
            );


            console.log(
                "Media files:",
                mediaFiles.length
            );


            showMedia();

        }

        catch (error) {

            if (
                error.name === "AbortError"
            ) {

                return;

            }


            console.error(
                "Folder picker error:",
                error
            );

        }

    }


    // ======================================
    // OLD BROWSER FALLBACK
    // ======================================

    else {

        folderInput.click();

    }

}


// ==========================================
// FOLDER BUTTONS
// ==========================================

if (folderBtn) {

    folderBtn.addEventListener(
        "click",
        chooseFolder
    );

}


if (selectFolderEmpty) {

    selectFolderEmpty.addEventListener(
        "click",
        chooseFolder
    );

}


// ==========================================
// OLD BROWSER FOLDER INPUT
// ==========================================

if (folderInput) {

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
                "Selected media:",
                mediaFiles
            );


            showMedia();


            // Same folder dobara select kar sake
            folderInput.value = "";

        }
    );

}


// ==========================================
// SHOW MEDIA
// ==========================================

function showMedia() {

    mediaGrid.innerHTML = "";


    // ======================================
    // FILTER
    // ======================================

    let filteredFiles =
        mediaFiles.filter(function (file) {

            if (
                currentFilter === "video"
            ) {

                return file.type.startsWith(
                    "video/"
                );

            }


            if (
                currentFilter === "image"
            ) {

                return file.type.startsWith(
                    "image/"
                );

            }


            return true;

        });


    // ======================================
    // SEARCH
    // ======================================

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    if (
        searchText !== ""
    ) {

        filteredFiles =
            filteredFiles.filter(function (file) {

                return file.name
                    .toLowerCase()
                    .includes(
                        searchText
                    );

            });

    }


    // ======================================
    // EMPTY
    // ======================================

    if (
        filteredFiles.length === 0
    ) {

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


    card.className =
        "media-card";


    const thumbnail =
        document.createElement("div");


    thumbnail.className =
        "thumbnail";


    const url =
        createMediaURL(file);


    // ======================================
    // VIDEO
    // ======================================

    if (
        file.type.startsWith("video/")
    ) {

        const video =
            document.createElement("video");


        video.src = url;

        video.muted = true;

        video.playsInline = true;

        video.preload = "metadata";

        video.className =
            "preview-video";


        thumbnail.appendChild(
            video
        );


        const icon =
            document.createElement("div");


        icon.className =
            "preview-play";

        icon.innerText =
            "▶ Preview";


        thumbnail.appendChild(
            icon
        );


        // ==================================
        // HOVER START
        // ==================================

        card.addEventListener(
            "mouseenter",
            function () {

                video.currentTime = 0;

                video.play().catch(
                    function () {}
                );

            }
        );


        // ==================================
        // HOVER STOP
        // ==================================

        card.addEventListener(
            "mouseleave",
            function () {

                video.pause();

                video.currentTime = 0;

            }
        );

    }


    // ======================================
    // IMAGE
    // ======================================

    else {

        const image =
            document.createElement("img");


        image.src = url;

        image.alt = file.name;

        image.loading = "lazy";


        thumbnail.appendChild(
            image
        );


        const icon =
            document.createElement("div");


        icon.className =
            "image-icon";

        icon.innerText =
            "🖼 Image";


        thumbnail.appendChild(
            icon
        );

    }


    // ======================================
    // TITLE
    // ======================================

    const title =
        document.createElement("div");


    title.className =
        "media-title";


    title.innerText =
        file.name;


    // ======================================
    // SIZE
    // ======================================

    const info =
        document.createElement("div");


    info.className =
        "media-info";


    info.innerText =
        formatFileSize(
            file.size
        );


    // ======================================
    // ADD TO CARD
    // ======================================

    card.appendChild(
        thumbnail
    );

    card.appendChild(
        title
    );

    card.appendChild(
        info
    );


    // ======================================
    // OPEN MEDIA
    // ======================================

    card.addEventListener(
        "click",
        function () {

            openMedia(file);

        }
    );


    mediaGrid.appendChild(
        card
    );

}


// ==========================================
// FILE SIZE
// ==========================================

function formatFileSize(bytes) {

    const sizeMB =
        bytes / (1024 * 1024);


    return (
        sizeMB.toFixed(1) +
        " MB"
    );

}


// ==========================================
// OPEN MEDIA
// ==========================================

function openMedia(file) {

    currentMediaFile =
        file;

    // Every newly opened media starts at normal orientation.
    resetVideoRotation();


    const url =
        createMediaURL(file);


    playerModal.classList.add(
        "show"
    );


    document.body.classList.add(
        "watching-media"
    );


    // ======================================
    // TITLE
    // ======================================

    playerTitle.innerText =
        file.name;


    // ======================================
    // SIZE
    // ======================================

    mediaSize.innerText =
        formatFileSize(
            file.size
        );


    // ======================================
    // VIDEO
    // ======================================

    if (
        file.type.startsWith("video/")
    ) {

        if (customVideoControls) {
            customVideoControls.style.display = "flex";
        }

        mediaType.innerText =
            "🎬 Video";


        imageViewer.style.display =
            "none";


        videoPlayer.style.display =
            "block";

        if (videoProgress) {
            videoProgress.value = 0;
        }

        if (videoCurrentTime) {
            videoCurrentTime.innerText = "0:00";
        }

        if (videoDuration) {
            videoDuration.innerText = "0:00";
        }

        videoPlayer.src =
            url;


        videoPlayer.muted =
            false;


        videoPlayer.play().catch(
            function (error) {

                console.log(
                    "Video autoplay blocked:",
                    error
                );

            }
        );

    }


    // ======================================
    // IMAGE
    // ======================================

    else {

        if (customVideoControls) {
            customVideoControls.style.display = "none";
        }

        mediaType.innerText =
            "🖼 Image";


        videoPlayer.pause();

        videoPlayer.removeAttribute(
            "src"
        );


        videoPlayer.style.display =
            "none";


        imageViewer.style.display =
            "block";


        imageViewer.src =
            url;

    }


    // ======================================
    // OTHER MEDIA
    // ======================================

    showRecommendations(
        file
    );


    showMoreMedia(
        file
    );

}


// ==========================================
// RECOMMENDATIONS
// ==========================================

function showRecommendations(
    currentFile
) {

    recommendationList.innerHTML =
        "";


    const recommendations =
        mediaFiles.filter(
            function (file) {

                return file !== currentFile;

            }
        );


    const limited =
        recommendations.slice(
            0,
            10
        );


    limited.forEach(
        function (file) {

            createRecommendation(
                file
            );

        }
    );


    if (
        limited.length === 0
    ) {

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

function createRecommendation(
    file
) {

    const card =
        document.createElement("div");


    card.className =
        "recommendation-card";


    const thumbnail =
        document.createElement("div");


    thumbnail.className =
        "recommendation-thumbnail";


    const url =
        createMediaURL(file);


    // ======================================
    // VIDEO
    // ======================================

    if (
        file.type.startsWith("video/")
    ) {

        const video =
            document.createElement("video");


        video.src = url;

        video.muted = true;

        video.playsInline = true;

        video.preload = "metadata";

        video.setAttribute(
            "webkit-playsinline",
            ""
        );


        thumbnail.appendChild(
            video
        );


        card.addEventListener(
            "mouseenter",
            function () {

                video.currentTime = 0;

                video.play().catch(
                    function () {}
                );

            }
        );


        card.addEventListener(
            "mouseleave",
            function () {

                video.pause();

                video.currentTime = 0;

            }
        );

    }


    // ======================================
    // IMAGE
    // ======================================

    else {

        const image =
            document.createElement("img");


        image.src = url;

        image.alt = file.name;

        image.loading = "lazy";


        thumbnail.appendChild(
            image
        );

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


    size.innerText =
        formatFileSize(
            file.size
        );


    info.appendChild(
        title
    );

    info.appendChild(
        size
    );


    // ======================================
    // ADD
    // ======================================

    card.appendChild(
        thumbnail
    );

    card.appendChild(
        info
    );


    // ======================================
    // CLICK
    // ======================================

    card.addEventListener(
        "click",
        function () {

            openMedia(
                file
            );

        }
    );


    recommendationList.appendChild(
        card
    );

}

// ==========================================
// ROTATE VIDEO
// ==========================================

function applyVideoRotation() {

    if (!videoPlayer) {
        return;
    }

    const container =
        document.querySelector(".video-wrapper");

    if (!container) {
        return;
    }

    // Video ki original dimensions
    const videoWidth =
        videoPlayer.videoWidth;

    const videoHeight =
        videoPlayer.videoHeight;

    if (!videoWidth || !videoHeight) {
        return;
    }

    const containerWidth =
        container.clientWidth;

    const containerHeight =
        container.clientHeight;

    if (!containerWidth || !containerHeight) {
        return;
    }

    // Video ka original aspect ratio
    const videoRatio =
        videoWidth / videoHeight;

    const containerRatio =
        containerWidth / containerHeight;

    // Object-fit: contain ke according
    // video ka actual displayed size calculate karo
    let displayedWidth;
    let displayedHeight;

    if (videoRatio > containerRatio) {

        displayedWidth =
            containerWidth;

        displayedHeight =
            containerWidth / videoRatio;

    } else {

        displayedHeight =
            containerHeight;

        displayedWidth =
            containerHeight * videoRatio;

    }

    // Normal orientation
    if (videoRotation % 180 === 0) {

        videoPlayer.style.transform =
            `rotate(${videoRotation}deg)`;

        return;
    }

    // 90° / 270°
    // Rotation ke baad width/height swap ho jaati hai
    const rotatedWidth =
        displayedHeight;

    const rotatedHeight =
        displayedWidth;

    // Player area ko fill karne ke liye scale
    const scaleX =
        containerWidth / rotatedWidth;

    const scaleY =
        containerHeight / rotatedHeight;

    const scale =
        Math.max(scaleX, scaleY);

    videoPlayer.style.transform =
        `rotate(${videoRotation}deg) scale(${scale})`;
}

function resetVideoRotation() {

    videoRotation = 0;

    videoPlayer.style.transform =
        "rotate(0deg) scale(1)";

}


if (rotateVideoBtn) {

    rotateVideoBtn.addEventListener(
        "click",
        function () {

            if (!currentMediaFile ||
                !currentMediaFile.type.startsWith("video/")) {
                return;
            }

            videoRotation += 90;

            if (videoRotation >= 360) {
                videoRotation = 0;
            }

            applyVideoRotation();

        }
    );

}


window.addEventListener(
    "resize",
    function () {

        if (
            playerModal &&
            playerModal.classList.contains("show") &&
            videoRotation % 180 !== 0
        ) {

            applyVideoRotation();

        }

    }
);


// ==========================================
// CUSTOM VIDEO CONTROLS
// ==========================================

const playPauseBtn =
    document.getElementById("playPauseBtn");

const videoProgress =
    document.getElementById("videoProgress");

const videoCurrentTime =
    document.getElementById("videoCurrentTime");

const videoDuration =
    document.getElementById("videoDuration");

const fullscreenVideoBtn =
    document.getElementById("fullscreenVideoBtn");

const customVideoControls =
    document.getElementById("customVideoControls");


// ==========================================
// FORMAT VIDEO TIME
// ==========================================

function formatVideoTime(seconds) {

    if (
        !Number.isFinite(seconds)
    ) {

        return "0:00";

    }


    const minutes =
        Math.floor(seconds / 60);


    const remainingSeconds =
        Math.floor(seconds % 60);


    return (
        minutes +
        ":" +
        String(
            remainingSeconds
        ).padStart(2, "0")
    );

}


// ==========================================
// PLAY / PAUSE
// ==========================================

playPauseBtn.addEventListener(
    "click",
    function () {

        if (
            videoPlayer.paused
        ) {

            videoPlayer.play();

        }

        else {

            videoPlayer.pause();

        }

    }
);


// ==========================================
// PLAY STATE
// ==========================================

videoPlayer.addEventListener(
    "play",
    function () {

        playPauseBtn.innerText =
            "⏸";

    }
);


videoPlayer.addEventListener(
    "pause",
    function () {

        playPauseBtn.innerText =
            "▶";

    }
);


// ==========================================
// VIDEO TIME UPDATE
// ==========================================

videoPlayer.addEventListener(
    "timeupdate",
    function () {

        if (
            !videoPlayer.duration
        ) {

            return;

        }


        const progress =
            (
                videoPlayer.currentTime /
                videoPlayer.duration
            ) * 100;


        videoProgress.value =
            progress;


        videoCurrentTime.innerText =
            formatVideoTime(
                videoPlayer.currentTime
            );

    }
);


// ==========================================
// VIDEO LOADED
// ==========================================

videoPlayer.addEventListener(
    "loadedmetadata",
    function () {

        videoDuration.innerText =
            formatVideoTime(
                videoPlayer.duration
            );

        // Recalculate 90° / 270° scale after the video dimensions are known.
        if (videoRotation % 180 !== 0) {
            requestAnimationFrame(applyVideoRotation);
        }

    }
);


// ==========================================
// PROGRESS BAR
// ==========================================

videoProgress.addEventListener(
    "input",
    function () {

        if (
            !videoPlayer.duration
        ) {

            return;

        }


        const newTime =
            (
                videoProgress.value /
                100
            ) *
            videoPlayer.duration;


        videoPlayer.currentTime =
            newTime;

    }
);


// ==========================================
// FULLSCREEN
// ==========================================

fullscreenVideoBtn.addEventListener(
    "click",
    function () {

        toggleFullscreen();

    }
);

// ==========================================
// CLOSE PLAYER
// ==========================================

closePlayer.addEventListener(
    "click",
    closePlayerWindow
);


function closePlayerWindow() {

    videoRotation = 0;

videoPlayer.style.transform = "rotate(0deg) scale(1)";

    videoPlayer.pause();

    videoPlayer.removeAttribute(
        "src"
    );

    videoPlayer.load();


    imageViewer.removeAttribute(
        "src"
    );


    playerModal.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "watching-media"
    );


    currentMediaFile =
        null;

}


// ==========================================
// CLICK OUTSIDE PLAYER
// ==========================================

playerModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === playerModal
        ) {

            closePlayerWindow();

        }

    }
);


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener(
    "input",
    showMedia
);


// ==========================================
// FILTER BUTTONS
// ==========================================

const filters =
    document.querySelectorAll(
        ".filter"
    );


filters.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                currentFilter =
                    button.dataset.filter;


                updateFilterButtons();

                showMedia();

            }
        );

    }
);


// ==========================================
// SIDEBAR - VIDEOS
// ==========================================

const videosFilter =
    document.getElementById(
        "videosFilter"
    );


if (videosFilter) {

    videosFilter.addEventListener(
        "click",
        function () {

            currentFilter =
                "video";

            updateFilterButtons();

            showMedia();

        }
    );

}


// ==========================================
// SIDEBAR - IMAGES
// ==========================================

const imagesFilter =
    document.getElementById(
        "imagesFilter"
    );


if (imagesFilter) {

    imagesFilter.addEventListener(
        "click",
        function () {

            currentFilter =
                "image";

            updateFilterButtons();

            showMedia();

        }
    );

}


// ==========================================
// SIDEBAR - ALL
// ==========================================

const allFilter =
    document.getElementById(
        "allFilter"
    );


if (allFilter) {

    allFilter.addEventListener(
        "click",
        function () {

            currentFilter =
                "all";

            updateFilterButtons();

            showMedia();

        }
    );

}


// ==========================================
// UPDATE FILTER BUTTONS
// ==========================================

function updateFilterButtons() {

    filters.forEach(
        function (button) {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.filter ===
                currentFilter
            ) {

                button.classList.add(
                    "active"
                );

            }

        }
    );

}


// ==========================================
// SAME TYPE MEDIA
// ==========================================

function getSameTypeMedia() {

    if (!currentMediaFile) {

        return [];

    }


    const isVideo =
        currentMediaFile.type.startsWith(
            "video/"
        );


    return mediaFiles.filter(
        function (file) {

            return isVideo
                ? file.type.startsWith("video/")
                : file.type.startsWith("image/");

        }
    );

}


// ==========================================
// NEXT MEDIA
// ==========================================

function nextMediaFile() {

    const list =
        getSameTypeMedia();


    if (
        list.length === 0
    ) {

        return;

    }


    const currentIndex =
        list.indexOf(
            currentMediaFile
        );


    let nextIndex =
        currentIndex + 1;


    if (
        nextIndex >= list.length
    ) {

        nextIndex = 0;

    }


    openMedia(
        list[nextIndex]
    );

}


// ==========================================
// PREVIOUS MEDIA
// ==========================================

function previousMediaFile() {

    const list =
        getSameTypeMedia();


    if (
        list.length === 0
    ) {

        return;

    }


    const currentIndex =
        list.indexOf(
            currentMediaFile
        );


    let previousIndex =
        currentIndex - 1;


    if (
        previousIndex < 0
    ) {

        previousIndex =
            list.length - 1;

    }


    openMedia(
        list[previousIndex]
    );

}


// ==========================================
// KEYBOARD CONTROLS
// ==========================================

document.addEventListener(
    "keydown",
    function (event) {

        // Player open nahi hai
        if (
            !playerModal.classList.contains(
                "show"
            )
        ) {

            return;

        }


        // Search/text inputs ke andar keyboard shortcuts na chalao.
        // Progress range ko bhi normal browser keyboard behavior do.
        if (
            event.target.tagName === "TEXTAREA" ||
            (
                event.target.tagName === "INPUT" &&
                event.target.id !== "videoProgress"
            )
        ) {

            return;

        }


        // ==================================
        // SPACE
        // ==================================

        if (
            event.code === "Space"
        ) {

            if (
                currentMediaFile &&
                currentMediaFile.type.startsWith(
                    "video/"
                )
            ) {

                event.preventDefault();


                if (
                    videoPlayer.paused
                ) {

                    videoPlayer.play();

                }

                else {

                    videoPlayer.pause();

                }

            }

        }


        // ==================================
        // J = BACKWARD
        // ==================================

        else if (
            event.key.toLowerCase() === "j"
        ) {

            if (
                currentMediaFile &&
                currentMediaFile.type.startsWith(
                    "video/"
                )
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
        // L = FORWARD
        // ==================================

        else if (
            event.key.toLowerCase() === "l"
        ) {

            if (
                currentMediaFile &&
                currentMediaFile.type.startsWith(
                    "video/"
                )
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
        // LEFT
        // ==================================

        else if (
            event.key === "ArrowLeft"
        ) {

            event.preventDefault();

            previousMediaFile();

        }


        // ==================================
        // RIGHT
        // ==================================

        else if (
            event.key === "ArrowRight"
        ) {

            event.preventDefault();

            nextMediaFile();

        }


        // ==================================
        // UP
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
        // DOWN
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
// R = ROTATE
// ==================================

else if (
    event.key.toLowerCase() === "r"
) {

    if (
        currentMediaFile &&
        currentMediaFile.type.startsWith("video/")
    ) {

        event.preventDefault();

        videoRotation += 90;

        if (videoRotation >= 360) {
            videoRotation = 0;
        }

        applyVideoRotation();

    }

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

function showMoreMedia(
    currentFile
) {

    belowMediaGrid.innerHTML =
        "";


    const otherFiles =
        mediaFiles.filter(
            function (file) {

                return file !== currentFile;

            }
        );


    const filesToShow =
        otherFiles.slice(
            0,
            20
        );


    filesToShow.forEach(
        function (file) {

            createBelowMediaCard(
                file
            );

        }
    );

}


// ==========================================
// CREATE BELOW MEDIA CARD
// ==========================================

function createBelowMediaCard(
    file
) {

    const card =
        document.createElement("div");


    card.className =
        "below-media-card";


    const thumbnail =
        document.createElement("div");


    thumbnail.className =
        "below-media-thumbnail";


    const url =
        createMediaURL(file);


    // ======================================
    // VIDEO
    // ======================================

    if (
        file.type.startsWith("video/")
    ) {

        const video =
            document.createElement("video");


        video.src = url;

        video.muted = true;

        video.playsInline = true;

        video.preload = "metadata";

        video.setAttribute(
            "webkit-playsinline",
            ""
        );


        thumbnail.appendChild(
            video
        );


        card.addEventListener(
            "mouseenter",
            function () {

                video.currentTime = 0;

                video.play().catch(
                    function () {}
                );

            }
        );


        card.addEventListener(
            "mouseleave",
            function () {

                video.pause();

                video.currentTime = 0;

            }
        );

    }


    // ======================================
    // IMAGE
    // ======================================

    else {

        const image =
            document.createElement("img");


        image.src = url;

        image.alt = file.name;

        image.loading = "lazy";


        thumbnail.appendChild(
            image
        );

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
    // INFO
    // ======================================

    const info =
        document.createElement("div");


    info.className =
        "below-media-info";


    const size =
        formatFileSize(
            file.size
        );


    if (
        file.type.startsWith("video/")
    ) {

        info.innerText =
            "🎬 Video • " + size;

    }

    else {

        info.innerText =
            "🖼 Image • " + size;

    }


    // ======================================
    // ADD
    // ======================================

    card.appendChild(
        thumbnail
    );

    card.appendChild(
        title
    );

    card.appendChild(
        info
    );


    // ======================================
    // CLICK
    // ======================================

    card.addEventListener(
        "click",
        function () {

            openMedia(
                file
            );

        }
    );


    belowMediaGrid.appendChild(
        card
    );

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
// FULLSCREEN
// ==========================================

function toggleFullscreen() {

    let fullscreenElement =
        null;


    // ======================================
    // VIDEO
    // ======================================

    if (
        currentMediaFile &&
        currentMediaFile.type.startsWith(
            "video/"
        )
    ) {
fullscreenElement =
    document.querySelector(".video-wrapper");

    }


    // ======================================
    // IMAGE
    // ======================================

    else if (
        currentMediaFile &&
        currentMediaFile.type.startsWith(
            "image/"
        )
    ) {

        fullscreenElement =
            imageViewer;

    }


    if (!fullscreenElement) {

        return;

    }


    // ======================================
    // ENTER FULLSCREEN
    // ======================================

    if (
        !document.fullscreenElement
    ) {

        fullscreenElement
            .requestFullscreen()
            .catch(
                function (error) {

                    console.log(
                        "Fullscreen error:",
                        error
                    );

                }
            );

    }


    // ======================================
    // EXIT FULLSCREEN
    // ======================================

    else {

        document.exitFullscreen();

    }

}



// ==========================================
// FULLSCREEN CHANGE
// KEEP VIDEO ROTATION
// ==========================================

document.addEventListener(
    "fullscreenchange",
    function () {

        if (
            currentMediaFile &&
            currentMediaFile.type.startsWith("video/")
        ) {

            // Browser ko fullscreen dimensions update
            // karne ka time do
            requestAnimationFrame(function () {

                requestAnimationFrame(function () {

                    applyVideoRotation();

                });

            });

        }

    }
);