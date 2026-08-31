"use strict";

const DOWNLOAD_BUTTON_SELECTOR = "#download, #secondaryDownload";

function revealDownloadButton(button) {
  button.hidden = false;
  button.disabled = false;
  button.removeAttribute("hidden");
  button.removeAttribute("disabled");
  button.removeAttribute("aria-hidden");
  button.style.removeProperty("display");
  button.title = "下载教学大纲";
  button.setAttribute("aria-label", "下载教学大纲");
}

function revealDownloadButtons(doc) {
  const buttons = [...doc.querySelectorAll(DOWNLOAD_BUTTON_SELECTOR)];
  buttons.forEach(revealDownloadButton);
  return buttons.length;
}

function start() {
  const apply = () => revealDownloadButtons(document);

  apply();

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["aria-hidden", "disabled", "hidden", "style"],
    childList: true,
    subtree: true
  });
}

start();
