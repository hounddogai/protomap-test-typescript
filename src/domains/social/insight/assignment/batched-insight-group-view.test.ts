import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedInsightGroupView, toBatchedInsightGroupViews } from "./batched-insight-group-view.js";
import { newBatchedInsightGroup } from "./batched-insight-group.js";

test("BatchedInsightGroupView shows the status in capitals", () => {
  const item = newBatchedInsightGroup("code-943", "label-484");
  const view = toBatchedInsightGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedInsightGroupViews([item, item]).length, 2, "views");
});
