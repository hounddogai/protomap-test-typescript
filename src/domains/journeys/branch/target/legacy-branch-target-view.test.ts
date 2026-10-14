import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyBranchTargetView, toLegacyBranchTargetViews } from "./legacy-branch-target-view.js";
import { newLegacyBranchTarget } from "./legacy-branch-target.js";

test("LegacyBranchTargetView shows the status in capitals", () => {
  const item = newLegacyBranchTarget("code-669", "title-277");
  const view = toLegacyBranchTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyBranchTargetViews([item, item]).length, 2, "views");
});
