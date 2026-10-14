import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedComplaintWindowView, toBatchedComplaintWindowViews } from "./batched-complaint-window-view.js";
import { newBatchedComplaintWindow } from "./batched-complaint-window.js";

test("BatchedComplaintWindowView shows the status in capitals", () => {
  const item = newBatchedComplaintWindow("code-518", "title-376");
  const view = toBatchedComplaintWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedComplaintWindowViews([item, item]).length, 2, "views");
});
