import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceClaimView, toBounceClaimViews } from "./bounce-claim-view.js";
import { newBounceClaim } from "./bounce-claim.js";

test("BounceClaimView shows the status in capitals", () => {
  const item = newBounceClaim("code-461", "title-797");
  const view = toBounceClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceClaimViews([item, item]).length, 2, "views");
});
