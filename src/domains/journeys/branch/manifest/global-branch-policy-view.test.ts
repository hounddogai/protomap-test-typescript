import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBranchPolicyView, toGlobalBranchPolicyViews } from "./global-branch-policy-view.js";
import { newGlobalBranchPolicy } from "./global-branch-policy.js";

test("GlobalBranchPolicyView shows the status in capitals", () => {
  const item = newGlobalBranchPolicy("code-868", "name-490");
  const view = toGlobalBranchPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBranchPolicyViews([item, item]).length, 2, "views");
});
