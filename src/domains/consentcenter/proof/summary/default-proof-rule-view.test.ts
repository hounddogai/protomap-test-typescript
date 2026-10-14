import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultProofRuleView, toDefaultProofRuleViews } from "./default-proof-rule-view.js";
import { newDefaultProofRule } from "./default-proof-rule.js";

test("DefaultProofRuleView shows the status in capitals", () => {
  const item = newDefaultProofRule("code-683", "title-433");
  const view = toDefaultProofRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultProofRuleViews([item, item]).length, 2, "views");
});
