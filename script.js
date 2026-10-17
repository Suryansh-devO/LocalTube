
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
const sortBtn = document.getElementById("sortBtn");
const sortMenu = document.getElementById("sortMenu");
const sortBy = document.getElementById("sortBy");
const sortOrder = document.getElementById("sortOrder");

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
const rotateNextToggleBtn =
    document.getElementById("rotateNextToggleBtn");


// ==========================================
// MEDIA STATE
// ==========================================

let mediaFiles = [];

let currentMediaFile = null;

let currentFilter = "all";
let currentSort = "name";
let currentSortOrder = "asc";

let videoRotation = 0;
let rotateNextEnabled = false;




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
// SORT MEDIA FILES
// ==========================================

function sortMediaFiles(files) {
    const sortedFiles = [...files];
    const direction = currentSortOrder === "asc" ? 1 : -1;

    sortedFiles.sort(function (a, b) {
        let result = 0;

        if (currentSort === "name") {
            result = a.name.localeCompare(b.name, undefined, {
                numeric: true,
                sensitivity: "base"
            });
        } else if (currentSort === "date") {
            result = (a.lastModified || 0) - (b.lastModified || 0);
        } else if (currentSort === "size") {
            result = (a.size || 0) - (b.size || 0);
        } else if (currentSort === "type") {
            const typeA = a.type || getMediaType(a.name);
            const typeB = b.type || getMediaType(b.name);
            result = typeA.localeCompare(typeB, undefined, { sensitivity: "base" });
            if (result === 0) {
                result = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
            }
        }

        return result * direction;
    });

    return sortedFiles;
}

function getMediaType(fileName) {
    const extension = (fileName.split(".").pop() || "").toLowerCase();
    const videoExtensions = ["mp4", "m4v", "webm", "ogv", "ogg", "mov", "avi", "mkv", "3gp", "mpeg", "mpg", "wmv", "flv"];
    return videoExtensions.includes(extension) ? "video" : "image";
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


    // Sort the filtered + searched results.
    filteredFiles = sortMediaFiles(filteredFiles);

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
// SORT MENU EVENTS
// ==========================================

if (sortBtn && sortMenu) {
    sortBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        const isOpening = sortMenu.hidden;
        sortMenu.hidden = !isOpening;
        sortBtn.setAttribute("aria-expanded", String(isOpening));
    });

    sortMenu.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    document.addEventListener("click", function () {
        sortMenu.hidden = true;
        sortBtn.setAttribute("aria-expanded", "false");
        if (watchSortMenu) watchSortMenu.hidden = true;
        if (watchSortBtn) watchSortBtn.setAttribute("aria-expanded", "false");
    });
}

if (sortBy) {
    sortBy.addEventListener("change", function () {
        currentSort = sortBy.value;
        showMedia();
    });
}

if (sortOrder) {
    sortOrder.addEventListener("change", function () {
        currentSortOrder = sortOrder.value;
        showMedia();
    });
}

// Watch-page sort button shares the same sort settings as the home screen.
const watchSortBtn = document.getElementById("watchSortBtn");
const watchSortMenu = document.getElementById("watchSortMenu");
const watchSortBy = document.getElementById("watchSortBy");
const watchSortOrder = document.getElementById("watchSortOrder");

function syncSortControls() {
    if (sortBy) sortBy.value = currentSort;
    if (watchSortBy) watchSortBy.value = currentSort;
    if (sortOrder) sortOrder.value = currentSortOrder;
    if (watchSortOrder) watchSortOrder.value = currentSortOrder;
}

function applySortChoice(by, order) {
    if (by) currentSort = by;
    if (order) currentSortOrder = order;
    syncSortControls();
    showMedia();
    if (currentMediaFile) {
        showRecommendations(currentMediaFile);
        showMoreMedia(currentMediaFile);
    }
}

if (watchSortBtn && watchSortMenu) {
    watchSortBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        const opening = watchSortMenu.hidden;
        watchSortMenu.hidden = !opening;
        watchSortBtn.setAttribute("aria-expanded", String(opening));
    });
    watchSortMenu.addEventListener("click", function (event) {
        event.stopPropagation();
    });
}

if (watchSortBy) {
    watchSortBy.addEventListener("change", function () {
        applySortChoice(watchSortBy.value, currentSortOrder);
    });
}
if (watchSortOrder) {
    watchSortOrder.addEventListener("change", function () {
        applySortChoice(currentSort, watchSortOrder.value);
    });
}
if (sortBy) {
    sortBy.addEventListener("change", function () {
        applySortChoice(sortBy.value, currentSortOrder);
    });
}
if (sortOrder) {
    sortOrder.addEventListener("change", function () {
        applySortChoice(currentSort, sortOrder.value);
    });
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

function openMedia(file, preserveRotation = false) {

    const previousRotation = videoRotation;
    const previousWasVideo = !!currentMediaFile &&
        currentMediaFile.type.startsWith("video/");

    currentMediaFile = file;

    // Keep the same angle only when the user enabled Rotate Next and
    // another video is being opened through next/previous navigation.
    if (preserveRotation && rotateNextEnabled && previousWasVideo &&
        file.type.startsWith("video/")) {
        videoRotation = previousRotation;
    } else {
        resetVideoRotation();
    }


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

        videoPlayer.autoplay = true;
        videoPlayer.playsInline = true;
        videoPlayer.src = url;
        videoPlayer.load();

        videoPlayer.muted = false;
        updateLoopToggle();

        // Opening a media card is a user gesture, so try to start playback immediately.
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
        sortMediaFiles(mediaFiles.filter(
            function (file) {

                return file !== currentFile;

            }
        ));


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
    if (!videoPlayer) return;

    const wrapper = document.querySelector(".video-wrapper");
    if (!wrapper) return;

    const boxWidth = wrapper.clientWidth;
    const boxHeight = wrapper.clientHeight;
    if (!boxWidth || !boxHeight) return;

    // Always keep the browser's native controls disabled; LocalTube has custom controls.
    videoPlayer.controls = false;
    videoPlayer.removeAttribute("controls");
    videoPlayer.style.transformOrigin = "center center";
    videoPlayer.style.transition = "transform 0.22s ease";
    videoPlayer.style.flex = "0 0 auto";
    videoPlayer.style.maxWidth = "none";
    videoPlayer.style.maxHeight = "none";

    // 0° and 180°: normal video sizing, no special rotated dimensions.
    if (videoRotation % 180 === 0) {
        videoPlayer.style.position = "relative";
        videoPlayer.style.left = "auto";
        videoPlayer.style.top = "auto";
        videoPlayer.style.width = "100%";
        videoPlayer.style.height = "100%";
        videoPlayer.style.maxWidth = "100%";
        videoPlayer.style.maxHeight = "100%";
        videoPlayer.style.objectFit = "contain";
        videoPlayer.style.transform = `rotate(${videoRotation}deg)`;
        return;
    }

    // Wait for video metadata so we can preserve the source aspect ratio.
    const sourceWidth = videoPlayer.videoWidth;
    const sourceHeight = videoPlayer.videoHeight;
    if (!sourceWidth || !sourceHeight) {
        videoPlayer.style.position = "absolute";
        videoPlayer.style.left = "50%";
        videoPlayer.style.top = "50%";
        videoPlayer.style.width = `${boxHeight}px`;
        videoPlayer.style.height = `${boxWidth}px`;
        videoPlayer.style.objectFit = "contain";
        videoPlayer.style.transform =
            `translate(-50%, -50%) rotate(${videoRotation}deg)`;
        return;
    }

    // First calculate how large the source video would be in the viewport
    // without rotation, using object-fit: contain.
    const sourceRatio = sourceWidth / sourceHeight;
    let fittedWidth;
    let fittedHeight;

    if (sourceRatio >= boxWidth / boxHeight) {
        fittedWidth = boxWidth;
        fittedHeight = boxWidth / sourceRatio;
    } else {
        fittedHeight = boxHeight;
        fittedWidth = boxHeight * sourceRatio;
    }

    // Rotating swaps the fitted width/height. Scale the rotated frame to COVER
    // the viewport, avoiding the previous zero/near-zero visible-video issue.
    const rotatedWidth = fittedHeight;
    const rotatedHeight = fittedWidth;
    const scale = Math.max(
        boxWidth / rotatedWidth,
        boxHeight / rotatedHeight
    );

    videoPlayer.style.position = "absolute";
    videoPlayer.style.left = "50%";
    videoPlayer.style.top = "50%";
    videoPlayer.style.width = `${fittedWidth}px`;
    videoPlayer.style.height = `${fittedHeight}px`;
    videoPlayer.style.maxWidth = "none";
    videoPlayer.style.maxHeight = "none";
    videoPlayer.style.objectFit = "contain";
    videoPlayer.style.transform =
        `translate(-50%, -50%) rotate(${videoRotation}deg) scale(${scale})`;
}

function resetVideoRotation() {
    videoRotation = 0;
    if (!videoPlayer) return;

    videoPlayer.style.position = "relative";
    videoPlayer.style.left = "auto";
    videoPlayer.style.top = "auto";
    videoPlayer.style.width = "100%";
    videoPlayer.style.height = "100%";
    videoPlayer.style.maxWidth = "100%";
    videoPlayer.style.maxHeight = "100%";
    videoPlayer.style.objectFit = "contain";
    videoPlayer.style.transform = "rotate(0deg)";
}

function rotateVideoRight() {
    if (!currentMediaFile || !currentMediaFile.type.startsWith("video/")) return;

    // Requested order: first press turns right to 270°, then 180°, 90°, 0°.
    videoRotation = videoRotation === 0 ? 270 :
        videoRotation === 270 ? 180 :
        videoRotation === 180 ? 90 : 0;
    applyVideoRotation();
}

function updateRotateNextButton() {
    if (!rotateNextToggleBtn) return;
    rotateNextToggleBtn.textContent = rotateNextEnabled
        ? "↪ Rotate Next: On"
        : "↪ Rotate Next: Off";
    rotateNextToggleBtn.setAttribute("aria-pressed", String(rotateNextEnabled));
    rotateNextToggleBtn.classList.toggle("is-on", rotateNextEnabled);
}

if (rotateNextToggleBtn) {
    rotateNextToggleBtn.addEventListener("click", function () {
        rotateNextEnabled = !rotateNextEnabled;
        updateRotateNextButton();
    });
    updateRotateNextButton();
}

if (rotateVideoBtn) {
    rotateVideoBtn.addEventListener("click", rotateVideoRight);
}

window.addEventListener(
    "resize",
    function () {

        if (
            playerModal &&
            playerModal.classList.contains("show") &&
            videoRotation !== 0
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
const autoPlayToggleBtn = document.getElementById("autoPlayToggleBtn");
const loopVideoBtn = document.getElementById("loopVideoBtn");
let autoPlayNextEnabled = false;

function updateLoopToggle() {
    if (!loopVideoBtn) return;
    loopVideoBtn.textContent = videoPlayer.loop ? "🔁 Loop: On" : "🔁 Loop: Off";
    loopVideoBtn.setAttribute("aria-pressed", String(videoPlayer.loop));
    loopVideoBtn.classList.toggle("is-on", videoPlayer.loop);
}

function toggleVideoLoop() {
    if (!currentMediaFile || !currentMediaFile.type.startsWith("video/")) return;
    videoPlayer.loop = !videoPlayer.loop;
    updateLoopToggle();
}

if (loopVideoBtn) {
    loopVideoBtn.addEventListener("click", toggleVideoLoop);
    updateLoopToggle();
}

function updateAutoPlayToggle() {
    if (!autoPlayToggleBtn) return;
    autoPlayToggleBtn.textContent = autoPlayNextEnabled
        ? "▶ Auto Play: On"
        : "▶ Auto Play: Off";
    autoPlayToggleBtn.setAttribute("aria-pressed", String(autoPlayNextEnabled));
    autoPlayToggleBtn.classList.toggle("is-on", autoPlayNextEnabled);
}

if (autoPlayToggleBtn) {
    autoPlayToggleBtn.addEventListener("click", function () {
        autoPlayNextEnabled = !autoPlayNextEnabled;
        updateAutoPlayToggle();
    });
    updateAutoPlayToggle();
}


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


// Automatically open the next video only when Auto Play is turned ON.
videoPlayer.addEventListener("ended", function () {
    if (!autoPlayNextEnabled || !currentMediaFile) return;
    if (!currentMediaFile.type.startsWith("video/")) return;
    nextMediaFile();
});


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
        if (videoRotation !== 0) {
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

if (fullscreenVideoBtn) {
    fullscreenVideoBtn.addEventListener("click", toggleFullscreen);
}

// ==========================================
// CLOSE PLAYER
// ==========================================

closePlayer.addEventListener(
    "click",
    closePlayerWindow
);


function closePlayerWindow() {

    // If the watch player is fullscreen, exit fullscreen BEFORE hiding it.
    // Hiding a fullscreen element first can leave the browser stuck in fullscreen.
    if (document.fullscreenElement) {
        document.exitFullscreen()
            .catch(function (error) {
                console.warn("Could not exit fullscreen cleanly:", error);
            })
            .finally(finishClosePlayer);
        return;
    }

    finishClosePlayer();
}

function finishClosePlayer() {

    videoRotation = 0;
    videoPlayer.style.transform = "rotate(0deg) scale(1)";
    videoPlayer.pause();
    videoPlayer.removeAttribute("src");
    videoPlayer.load();

    imageViewer.removeAttribute("src");

    playerModal.classList.remove("show");
    document.body.classList.remove("watching-media");

    // Reset fullscreen-only UI state for the next time the player opens.
    const watchMain = document.querySelector(".watch-main");
    if (watchMain) {
        watchMain.classList.remove("fullscreen-controls-hidden");
    }

    currentMediaFile = null;
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


    return sortMediaFiles(mediaFiles.filter(
        function (file) {

            return isVideo
                ? file.type.startsWith("video/")
                : file.type.startsWith("image/");

        }
    ));

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
        list[nextIndex],
        rotateNextEnabled
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
        list[previousIndex],
        rotateNextEnabled
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
        // K = FORWARD 10 SECONDS
        // ==================================

        else if (event.key.toLowerCase() === "k") {
            if (
                currentMediaFile &&
                currentMediaFile.type.startsWith("video/")
            ) {
                event.preventDefault();
                videoPlayer.currentTime = Math.min(
                    videoPlayer.duration || Infinity,
                    videoPlayer.currentTime + 10
                );
            }
        }

        // ==================================
        // L = TOGGLE VIDEO LOOP
        // ==================================

        else if (event.key.toLowerCase() === "l") {
            if (
                currentMediaFile &&
                currentMediaFile.type.startsWith("video/")
            ) {
                event.preventDefault();
                toggleVideoLoop();
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
        // R = ROTATE CLOCKWISE (RIGHT)
        // ==================================

        else if (event.key.toLowerCase() === "r") {
            event.preventDefault();
            rotateVideoRight();
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
        sortMediaFiles(mediaFiles.filter(
            function (file) {

                return file !== currentFile;

            }
        ));


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
            document.querySelector(".watch-main");

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
// FULLSCREEN CLOSE BUTTON AUTO-HIDE
// Show Close while the mouse moves, then hide it after a short pause.
// ==========================================
const watchMainForFullscreen = document.querySelector(".watch-main");
let fullscreenCloseHideTimer = null;

function showFullscreenCloseButton() {
    if (!watchMainForFullscreen || document.fullscreenElement !== watchMainForFullscreen) {
        return;
    }

    watchMainForFullscreen.classList.remove("fullscreen-controls-hidden");

    if (fullscreenCloseHideTimer) {
        clearTimeout(fullscreenCloseHideTimer);
    }

    fullscreenCloseHideTimer = setTimeout(function () {
        if (document.fullscreenElement === watchMainForFullscreen) {
            watchMainForFullscreen.classList.add("fullscreen-controls-hidden");
        }
    }, 2200);
}

if (watchMainForFullscreen) {
    watchMainForFullscreen.addEventListener("mousemove", showFullscreenCloseButton);
    watchMainForFullscreen.addEventListener("pointermove", showFullscreenCloseButton);
    watchMainForFullscreen.addEventListener("touchstart", showFullscreenCloseButton, { passive: true });
}

document.addEventListener("fullscreenchange", function () {
    if (fullscreenCloseHideTimer) {
        clearTimeout(fullscreenCloseHideTimer);
        fullscreenCloseHideTimer = null;
    }

    if (watchMainForFullscreen) {
        watchMainForFullscreen.classList.remove("fullscreen-controls-hidden");
    }

    if (document.fullscreenElement === watchMainForFullscreen) {
        showFullscreenCloseButton();
    }
});

// Recalculate the rotated video after entering or leaving fullscreen.
document.addEventListener("fullscreenchange", function () {
    if (!currentMediaFile || !currentMediaFile.type.startsWith("video/")) return;
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            applyVideoRotation();
        });
    });
});
