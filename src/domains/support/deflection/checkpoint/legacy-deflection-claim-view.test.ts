import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyDeflectionClaimView, toLegacyDeflectionClaimViews } from "./legacy-deflection-claim-view.js";
import { newLegacyDeflectionClaim } from "./legacy-deflection-claim.js";

test("LegacyDeflectionClaimView shows the status in capitals", () => {
  const item = newLegacyDeflectionClaim("code-55", "label-351");
  const view = toLegacyDeflectionClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyDeflectionClaimViews([item, item]).length, 2, "views");
});
