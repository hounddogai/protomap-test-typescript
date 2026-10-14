import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientQueuePolicyView, toLenientQueuePolicyViews } from "./lenient-queue-policy-view.js";
import { newLenientQueuePolicy } from "./lenient-queue-policy.js";

test("LenientQueuePolicyView shows the status in capitals", () => {
  const item = newLenientQueuePolicy("code-744", "name-691");
  const view = toLenientQueuePolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientQueuePolicyViews([item, item]).length, 2, "views");
});
