import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleProfileStore } from "./bid-rule-profile-store.js";
import { newBidRuleProfile } from "./bid-rule-profile.js";

test("MemoryBidRuleProfileStore finds what it saved", () => {
  const store = newMemoryBidRuleProfileStore();
  const item = newBidRuleProfile("code-949", "label-795");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
