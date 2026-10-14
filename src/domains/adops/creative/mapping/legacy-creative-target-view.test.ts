import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCreativeTargetView, toLegacyCreativeTargetViews } from "./legacy-creative-target-view.js";
import { newLegacyCreativeTarget } from "./legacy-creative-target.js";

test("LegacyCreativeTargetView shows the status in capitals", () => {
  const item = newLegacyCreativeTarget("code-204", "title-584");
  const view = toLegacyCreativeTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCreativeTargetViews([item, item]).length, 2, "views");
});
