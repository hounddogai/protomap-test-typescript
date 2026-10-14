import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedMacroPolicyView, toBatchedMacroPolicyViews } from "./batched-macro-policy-view.js";
import { newBatchedMacroPolicy } from "./batched-macro-policy.js";

test("BatchedMacroPolicyView shows the status in capitals", () => {
  const item = newBatchedMacroPolicy("code-142", "label-522");
  const view = toBatchedMacroPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedMacroPolicyViews([item, item]).length, 2, "views");
});
