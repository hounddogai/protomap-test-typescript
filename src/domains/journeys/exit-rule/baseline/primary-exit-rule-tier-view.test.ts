import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryExitRuleTierView, toPrimaryExitRuleTierViews } from "./primary-exit-rule-tier-view.js";
import { newPrimaryExitRuleTier } from "./primary-exit-rule-tier.js";

test("PrimaryExitRuleTierView shows the status in capitals", () => {
  const item = newPrimaryExitRuleTier("code-945", "title-466");
  const view = toPrimaryExitRuleTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryExitRuleTierViews([item, item]).length, 2, "views");
});
