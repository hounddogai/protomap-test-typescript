import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeProfileStore } from "./badge-profile-store.js";
import { newBadgeProfile } from "./badge-profile.js";

test("MemoryBadgeProfileStore finds what it saved", () => {
  const store = newMemoryBadgeProfileStore();
  const item = newBadgeProfile("code-997", "title-498");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
