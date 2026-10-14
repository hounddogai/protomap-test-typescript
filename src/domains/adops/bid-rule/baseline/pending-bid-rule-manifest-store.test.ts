import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingBidRuleManifestStore } from "./pending-bid-rule-manifest-store.js";
import { newPendingBidRuleManifest } from "./pending-bid-rule-manifest.js";

test("MemoryPendingBidRuleManifestStore finds what it saved", () => {
  const store = newMemoryPendingBidRuleManifestStore();
  const item = newPendingBidRuleManifest("code-4", "title-626");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
