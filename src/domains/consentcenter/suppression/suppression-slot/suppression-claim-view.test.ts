import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionClaimView, toSuppressionClaimViews } from "./suppression-claim-view.js";
import { newSuppressionClaim } from "./suppression-claim.js";

test("SuppressionClaimView shows the status in capitals", () => {
  const item = newSuppressionClaim("code-949", "label-317");
  const view = toSuppressionClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionClaimViews([item, item]).length, 2, "views");
});
