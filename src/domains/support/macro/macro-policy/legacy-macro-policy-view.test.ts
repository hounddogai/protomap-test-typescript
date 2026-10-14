import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyMacroPolicyView, toLegacyMacroPolicyViews } from "./legacy-macro-policy-view.js";
import { newLegacyMacroPolicy } from "./legacy-macro-policy.js";

test("LegacyMacroPolicyView shows the status in capitals", () => {
  const item = newLegacyMacroPolicy("code-645", "title-758");
  const view = toLegacyMacroPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyMacroPolicyViews([item, item]).length, 2, "views");
});
