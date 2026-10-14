import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryWarmupPolicyView, toPrimaryWarmupPolicyViews } from "./primary-warmup-policy-view.js";
import { newPrimaryWarmupPolicy } from "./primary-warmup-policy.js";

test("PrimaryWarmupPolicyView shows the status in capitals", () => {
  const item = newPrimaryWarmupPolicy("code-150", "label-167");
  const view = toPrimaryWarmupPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryWarmupPolicyViews([item, item]).length, 2, "views");
});
