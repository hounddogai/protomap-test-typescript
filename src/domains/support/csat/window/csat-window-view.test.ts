import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatWindowView, toCsatWindowViews } from "./csat-window-view.js";
import { newCsatWindow } from "./csat-window.js";

test("CsatWindowView shows the status in capitals", () => {
  const item = newCsatWindow("code-19", "name-503");
  const view = toCsatWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatWindowViews([item, item]).length, 2, "views");
});
