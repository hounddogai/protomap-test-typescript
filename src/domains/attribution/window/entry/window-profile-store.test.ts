import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowProfileStore } from "./window-profile-store.js";
import { newWindowProfile } from "./window-profile.js";

test("MemoryWindowProfileStore finds what it saved", () => {
  const store = newMemoryWindowProfileStore();
  const item = newWindowProfile("code-513", "name-29");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
