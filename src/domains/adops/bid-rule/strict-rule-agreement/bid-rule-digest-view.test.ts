import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleDigestView, toBidRuleDigestViews } from "./bid-rule-digest-view.js";
import { newBidRuleDigest } from "./bid-rule-digest.js";

test("BidRuleDigestView shows the status in capitals", () => {
  const item = newBidRuleDigest("code-203", "title-769");
  const view = toBidRuleDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleDigestViews([item, item]).length, 2, "views");
});
