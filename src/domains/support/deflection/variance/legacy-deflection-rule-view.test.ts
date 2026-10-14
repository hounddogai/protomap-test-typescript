import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyDeflectionRuleView, toLegacyDeflectionRuleViews } from "./legacy-deflection-rule-view.js";
import { newLegacyDeflectionRule } from "./legacy-deflection-rule.js";

test("LegacyDeflectionRuleView shows the status in capitals", () => {
  const item = newLegacyDeflectionRule("code-522", "title-864");
  const view = toLegacyDeflectionRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyDeflectionRuleViews([item, item]).length, 2, "views");
});
