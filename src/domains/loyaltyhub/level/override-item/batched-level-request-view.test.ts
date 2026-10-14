import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedLevelRequestView, toBatchedLevelRequestViews } from "./batched-level-request-view.js";
import { newBatchedLevelRequest } from "./batched-level-request.js";

test("BatchedLevelRequestView shows the status in capitals", () => {
  const item = newBatchedLevelRequest("code-977", "title-517");
  const view = toBatchedLevelRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedLevelRequestViews([item, item]).length, 2, "views");
});
