import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingOptOutTierStore } from "./pending-opt-out-tier-store.js";
import { newPendingOptOutTier } from "./pending-opt-out-tier.js";

test("MemoryPendingOptOutTierStore finds what it saved", () => {
  const store = newMemoryPendingOptOutTierStore();
  const item = newPendingOptOutTier("code-104", "name-415");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
