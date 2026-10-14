import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPayoutOverrideStore } from "./default-payout-override-store.js";
import { newDefaultPayoutOverride } from "./default-payout-override.js";

test("MemoryDefaultPayoutOverrideStore finds what it saved", () => {
  const store = newMemoryDefaultPayoutOverrideStore();
  const item = newDefaultPayoutOverride("code-927", "title-195");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
