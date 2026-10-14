import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPayoutOverrideStore } from "./fallback-payout-override-store.js";
import { newFallbackPayoutOverride } from "./fallback-payout-override.js";

test("MemoryFallbackPayoutOverrideStore finds what it saved", () => {
  const store = newMemoryFallbackPayoutOverrideStore();
  const item = newFallbackPayoutOverride("code-142", "name-641");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
