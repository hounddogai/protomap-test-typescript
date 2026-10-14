import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderWindowView, toSenderWindowViews } from "./sender-window-view.js";
import { newSenderWindow } from "./sender-window.js";

test("SenderWindowView shows the status in capitals", () => {
  const item = newSenderWindow("code-690", "title-785");
  const view = toSenderWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderWindowViews([item, item]).length, 2, "views");
});
