import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierProfileStore } from "./tier-profile-store.js";
import { newTierProfile } from "./tier-profile.js";

test("MemoryTierProfileStore finds what it saved", () => {
  const store = newMemoryTierProfileStore();
  const item = newTierProfile("code-795", "name-582");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
