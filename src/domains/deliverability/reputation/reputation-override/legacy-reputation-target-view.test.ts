import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyReputationTargetView, toLegacyReputationTargetViews } from "./legacy-reputation-target-view.js";
import { newLegacyReputationTarget } from "./legacy-reputation-target.js";

test("LegacyReputationTargetView shows the status in capitals", () => {
  const item = newLegacyReputationTarget("code-211", "title-117");
  const view = toLegacyReputationTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyReputationTargetViews([item, item]).length, 2, "views");
});
