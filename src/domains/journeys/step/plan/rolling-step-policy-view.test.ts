import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingStepPolicyView, toRollingStepPolicyViews } from "./rolling-step-policy-view.js";
import { newRollingStepPolicy } from "./rolling-step-policy.js";

test("RollingStepPolicyView shows the status in capitals", () => {
  const item = newRollingStepPolicy("code-207", "label-316");
  const view = toRollingStepPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingStepPolicyViews([item, item]).length, 2, "views");
});
