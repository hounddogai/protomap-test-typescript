import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCreativeOverrideView, toLegacyCreativeOverrideViews } from "./legacy-creative-override-view.js";
import { newLegacyCreativeOverride } from "./legacy-creative-override.js";

test("LegacyCreativeOverrideView shows the status in capitals", () => {
  const item = newLegacyCreativeOverride("code-488", "name-77");
  const view = toLegacyCreativeOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCreativeOverrideViews([item, item]).length, 2, "views");
});
