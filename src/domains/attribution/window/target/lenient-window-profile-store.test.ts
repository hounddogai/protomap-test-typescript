import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWindowProfileStore } from "./lenient-window-profile-store.js";
import { newLenientWindowProfile } from "./lenient-window-profile.js";

test("MemoryLenientWindowProfileStore finds what it saved", () => {
  const store = newMemoryLenientWindowProfileStore();
  const item = newLenientWindowProfile("code-621", "label-604");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
