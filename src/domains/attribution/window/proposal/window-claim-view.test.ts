import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowClaimView, toWindowClaimViews } from "./window-claim-view.js";
import { newWindowClaim } from "./window-claim.js";

test("WindowClaimView shows the status in capitals", () => {
  const item = newWindowClaim("code-180", "title-907");
  const view = toWindowClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowClaimViews([item, item]).length, 2, "views");
});
