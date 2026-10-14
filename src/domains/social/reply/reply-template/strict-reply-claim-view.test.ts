import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictReplyClaimView, toStrictReplyClaimViews } from "./strict-reply-claim-view.js";
import { newStrictReplyClaim } from "./strict-reply-claim.js";

test("StrictReplyClaimView shows the status in capitals", () => {
  const item = newStrictReplyClaim("code-828", "title-735");
  const view = toStrictReplyClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictReplyClaimViews([item, item]).length, 2, "views");
});
