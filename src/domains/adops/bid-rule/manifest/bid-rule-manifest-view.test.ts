import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleManifestView, toBidRuleManifestViews } from "./bid-rule-manifest-view.js";
import { newBidRuleManifest } from "./bid-rule-manifest.js";

test("BidRuleManifestView shows the status in capitals", () => {
  const item = newBidRuleManifest("code-729", "label-906");
  const view = toBidRuleManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleManifestViews([item, item]).length, 2, "views");
});
