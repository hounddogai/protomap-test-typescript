import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleDigestStore } from "./bid-rule-digest-store.js";
import { newBidRuleDigest } from "./bid-rule-digest.js";

test("MemoryBidRuleDigestStore finds what it saved", () => {
  const store = newMemoryBidRuleDigestStore();
  const item = newBidRuleDigest("code-203", "title-769");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
