import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBounceProfileStore } from "./fallback-bounce-profile-store.js";
import { newFallbackBounceProfile } from "./fallback-bounce-profile.js";

test("MemoryFallbackBounceProfileStore finds what it saved", () => {
  const store = newMemoryFallbackBounceProfileStore();
  const item = newFallbackBounceProfile("code-856", "name-225");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
