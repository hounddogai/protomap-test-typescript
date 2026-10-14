import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCreativeGroupView, toLegacyCreativeGroupViews } from "./legacy-creative-group-view.js";
import { newLegacyCreativeGroup } from "./legacy-creative-group.js";

test("LegacyCreativeGroupView shows the status in capitals", () => {
  const item = newLegacyCreativeGroup("code-21", "name-555");
  const view = toLegacyCreativeGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCreativeGroupViews([item, item]).length, 2, "views");
});
