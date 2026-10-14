import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedModelGroupView, toBatchedModelGroupViews } from "./batched-model-group-view.js";
import { newBatchedModelGroup } from "./batched-model-group.js";

test("BatchedModelGroupView shows the status in capitals", () => {
  const item = newBatchedModelGroup("code-78", "label-977");
  const view = toBatchedModelGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedModelGroupViews([item, item]).length, 2, "views");
});
