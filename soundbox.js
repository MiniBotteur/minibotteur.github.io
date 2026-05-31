const box = document.getElementById("soundBox");
const sound = document.getElementById("mySound");

box.addEventListener("click", () => {
  sound.currentTime = 0;
  sound.play();
});