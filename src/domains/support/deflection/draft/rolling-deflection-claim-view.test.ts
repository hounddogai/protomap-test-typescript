import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingDeflectionClaimView, toRollingDeflectionClaimViews } from "./rolling-deflection-claim-view.js";
import { newRollingDeflectionClaim } from "./rolling-deflection-claim.js";

test("RollingDeflectionClaimView shows the status in capitals", () => {
  const item = newRollingDeflectionClaim("code-659", "title-387");
  const view = toRollingDeflectionClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingDeflectionClaimViews([item, item]).length, 2, "views");
});
