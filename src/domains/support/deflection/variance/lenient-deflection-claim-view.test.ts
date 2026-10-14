import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientDeflectionClaimView, toLenientDeflectionClaimViews } from "./lenient-deflection-claim-view.js";
import { newLenientDeflectionClaim } from "./lenient-deflection-claim.js";

test("LenientDeflectionClaimView shows the status in capitals", () => {
  const item = newLenientDeflectionClaim("code-764", "name-573");
  const view = toLenientDeflectionClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientDeflectionClaimViews([item, item]).length, 2, "views");
});
