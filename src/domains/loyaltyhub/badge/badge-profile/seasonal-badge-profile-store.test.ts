import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalBadgeProfileStore } from "./seasonal-badge-profile-store.js";
import { newSeasonalBadgeProfile } from "./seasonal-badge-profile.js";

test("MemorySeasonalBadgeProfileStore finds what it saved", () => {
  const store = newMemorySeasonalBadgeProfileStore();
  const item = newSeasonalBadgeProfile("code-800", "name-575");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
