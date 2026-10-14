import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueuePolicyView, toQueuePolicyViews } from "./queue-policy-view.js";
import { newQueuePolicy } from "./queue-policy.js";

test("QueuePolicyView shows the status in capitals", () => {
  const item = newQueuePolicy("code-344", "label-978");
  const view = toQueuePolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueuePolicyViews([item, item]).length, 2, "views");
});
