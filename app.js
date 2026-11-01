const minutesSelect = document.getElementById("minutes");
const timerDisplay = document.getElementById("timer");
const statusDisplay = document.getElementById("status");

const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const resumeButton = document.getElementById("resume");
const resetButton = document.getElementById("reset");

let remainingSeconds = Number(minutesSelect.value) * 60;
let timerInterval = null;
let endTime = null;
let paused = false;

function displayTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;

  timerDisplay.textContent =
    String(minutes).padStart(2, "0") +
    ":" +
    String(secondsLeft).padStart(2, "0");
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimer() {
  if (endTime === null) return;

  remainingSeconds = Math.max(
    0,
    Math.ceil((endTime - Date.now()) / 1000)
  );

  displayTime(remainingSeconds);

  if (remainingSeconds <= 0) {
    stopTimer();
    endTime = null;
    paused = false;

    statusDisplay.textContent =
      "Your screen-time limit is over. Take an offline break!";

    showNotification();
  }
}

async function askNotificationPermission() {
  if (!("Notification" in window)) {
    statusDisplay.textContent =
      "Notifications are not supported by this browser.";
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  statusDisplay.textContent =
    "Notifications are blocked. Allow them in your browser settings.";

  return false;
}

async function showNotification() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const message = {
    title: "Digital Wellness Break",
    body: "Your time is up. Put your phone aside and choose an offline activity."
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(message.title, {
        body: message.body,
        icon: "./icon-192.png",
        badge: "./icon-192.png"
      });
    } else {
      new Notification(message.title, {
        body: message.body
      });
    }
  } catch (error) {
    console.log("Notification could not be displayed:", error);
  }
}

startButton.addEventListener("click", async () => {
  if (timerInterval !== null) return;

  const permissionGranted = await askNotificationPermission();

  if (!permissionGranted) {
    statusDisplay.textContent =
      "Timer started. Allow notifications if you want notification reminders.";
  } else {
    statusDisplay.textContent = "Your screen-time session has started.";
  }

  if (!paused) {
    remainingSeconds = Number(minutesSelect.value) * 60;
  }

  endTime = Date.now() + remainingSeconds * 1000;
  paused = false;

  timerInterval = setInterval(updateTimer, 250);
  updateTimer();
});

pauseButton.addEventListener("click", () => {
  if (timerInterval === null) return;

  updateTimer();
  stopTimer();

  endTime = null;
  paused = true;

  statusDisplay.textContent = "Timer paused.";
});

resumeButton.addEventListener("click", () => {
  if (!paused || timerInterval !== null || remainingSeconds <= 0) {
    return;
  }

  endTime = Date.now() + remainingSeconds * 1000;
  paused = false;

  statusDisplay.textContent = "Your screen-time session has resumed.";

  timerInterval = setInterval(updateTimer, 250);
  updateTimer();
});

resetButton.addEventListener("click", () => {
  stopTimer();

  remainingSeconds = Number(minutesSelect.value) * 60;
  endTime = null;
  paused = false;

  displayTime(remainingSeconds);
  statusDisplay.textContent = "Timer reset. Ready to begin?";
});

minutesSelect.addEventListener("change", () => {
  if (timerInterval !== null) return;

  remainingSeconds = Number(minutesSelect.value) * 60;
  endTime = null;
  paused = false;

  displayTime(remainingSeconds);
  statusDisplay.textContent = "Ready to begin?";
});

displayTime(remainingSeconds);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => {
        console.log("Service worker registered.");
      })
      .catch((error) => {
        console.log("Service worker registration failed:", error);
      });
  });
}
