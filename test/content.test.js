"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  revealDownloadButton,
  revealDownloadButtons
} = require("../src/content.js");

function createButton() {
  const attributes = new Map([
    ["aria-hidden", "true"],
    ["disabled", ""],
    ["hidden", ""]
  ]);
  const styles = new Map([["display", "none"]]);

  return {
    disabled: true,
    hidden: true,
    title: "保存",
    ariaLabel: null,
    removeAttribute(name) {
      attributes.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, value);
      if (name === "aria-label") this.ariaLabel = value;
    },
    style: {
      removeProperty(name) {
        styles.delete(name);
      }
    },
    hasAttribute(name) {
      return attributes.has(name);
    },
    hasStyle(name) {
      return styles.has(name);
    }
  };
}

test("reveals a hidden PDF.js download button", () => {
  const button = createButton();

  revealDownloadButton(button);

  assert.equal(button.hidden, false);
  assert.equal(button.disabled, false);
  assert.equal(button.hasAttribute("hidden"), false);
  assert.equal(button.hasAttribute("disabled"), false);
  assert.equal(button.hasAttribute("aria-hidden"), false);
  assert.equal(button.hasStyle("display"), false);
  assert.equal(button.title, "下载教学大纲");
  assert.equal(button.ariaLabel, "下载教学大纲");
});

test("reveals every matching download button", () => {
  const buttons = [createButton(), createButton()];
  const doc = {
    querySelectorAll(selector) {
      assert.equal(selector, "#download, #secondaryDownload");
      return buttons;
    }
  };

  assert.equal(revealDownloadButtons(doc), 2);
  assert.ok(buttons.every((button) => !button.hidden));
});
