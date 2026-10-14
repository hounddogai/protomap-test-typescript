import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictWindowProfileStore } from "./strict-window-profile-store.js";
import { newStrictWindowProfile } from "./strict-window-profile.js";

test("MemoryStrictWindowProfileStore finds what it saved", () => {
  const store = newMemoryStrictWindowProfileStore();
  const item = newStrictWindowProfile("code-486", "name-1");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
