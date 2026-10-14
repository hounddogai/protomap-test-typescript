import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPostWindowView, toBatchedPostWindowViews } from "./batched-post-window-view.js";
import { newBatchedPostWindow } from "./batched-post-window.js";

test("BatchedPostWindowView shows the status in capitals", () => {
  const item = newBatchedPostWindow("code-316", "label-114");
  const view = toBatchedPostWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPostWindowViews([item, item]).length, 2, "views");
});
