import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementWindowView, toPlacementWindowViews } from "./placement-window-view.js";
import { newPlacementWindow } from "./placement-window.js";

test("PlacementWindowView shows the status in capitals", () => {
  const item = newPlacementWindow("code-971", "title-973");
  const view = toPlacementWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementWindowViews([item, item]).length, 2, "views");
});
