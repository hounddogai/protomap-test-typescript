import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBadgeProfileStore } from "./tiered-badge-profile-store.js";
import { newTieredBadgeProfile } from "./tiered-badge-profile.js";

test("MemoryTieredBadgeProfileStore finds what it saved", () => {
  const store = newMemoryTieredBadgeProfileStore();
  const item = newTieredBadgeProfile("code-675", "title-744");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
