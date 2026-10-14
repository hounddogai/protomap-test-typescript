import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostClaimView, toPostClaimViews } from "./post-claim-view.js";
import { newPostClaim } from "./post-claim.js";

test("PostClaimView shows the status in capitals", () => {
  const item = newPostClaim("code-308", "label-16");
  const view = toPostClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostClaimViews([item, item]).length, 2, "views");
});
