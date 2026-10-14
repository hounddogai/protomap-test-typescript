import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientPostWindowView, toLenientPostWindowViews } from "./lenient-post-window-view.js";
import { newLenientPostWindow } from "./lenient-post-window.js";

test("LenientPostWindowView shows the status in capitals", () => {
  const item = newLenientPostWindow("code-386", "label-521");
  const view = toLenientPostWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientPostWindowViews([item, item]).length, 2, "views");
});
