import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalWaitPolicyView, toGlobalWaitPolicyViews } from "./global-wait-policy-view.js";
import { newGlobalWaitPolicy } from "./global-wait-policy.js";

test("GlobalWaitPolicyView shows the status in capitals", () => {
  const item = newGlobalWaitPolicy("code-317", "label-838");
  const view = toGlobalWaitPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalWaitPolicyViews([item, item]).length, 2, "views");
});
