import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalBadgeProfileStore } from "./global-badge-profile-store.js";
import { newGlobalBadgeProfile } from "./global-badge-profile.js";

test("MemoryGlobalBadgeProfileStore finds what it saved", () => {
  const store = newMemoryGlobalBadgeProfileStore();
  const item = newGlobalBadgeProfile("code-886", "name-809");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
