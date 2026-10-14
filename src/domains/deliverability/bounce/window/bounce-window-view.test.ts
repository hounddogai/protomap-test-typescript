import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceWindowView, toBounceWindowViews } from "./bounce-window-view.js";
import { newBounceWindow } from "./bounce-window.js";

test("BounceWindowView shows the status in capitals", () => {
  const item = newBounceWindow("code-57", "title-708");
  const view = toBounceWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceWindowViews([item, item]).length, 2, "views");
});
