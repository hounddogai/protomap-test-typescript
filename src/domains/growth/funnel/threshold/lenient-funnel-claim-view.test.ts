import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientFunnelClaimView, toLenientFunnelClaimViews } from "./lenient-funnel-claim-view.js";
import { newLenientFunnelClaim } from "./lenient-funnel-claim.js";

test("LenientFunnelClaimView shows the status in capitals", () => {
  const item = newLenientFunnelClaim("code-483", "label-825");
  const view = toLenientFunnelClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientFunnelClaimViews([item, item]).length, 2, "views");
});
