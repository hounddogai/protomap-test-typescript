import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleManifestStore } from "./bid-rule-manifest-store.js";
import { newBidRuleManifest } from "./bid-rule-manifest.js";

test("MemoryBidRuleManifestStore finds what it saved", () => {
  const store = newMemoryBidRuleManifestStore();
  const item = newBidRuleManifest("code-729", "label-906");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
