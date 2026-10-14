import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedWaitPolicyView, toBatchedWaitPolicyViews } from "./batched-wait-policy-view.js";
import { newBatchedWaitPolicy } from "./batched-wait-policy.js";

test("BatchedWaitPolicyView shows the status in capitals", () => {
  const item = newBatchedWaitPolicy("code-143", "title-608");
  const view = toBatchedWaitPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedWaitPolicyViews([item, item]).length, 2, "views");
});
