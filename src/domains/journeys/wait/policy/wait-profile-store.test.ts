import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitProfileStore } from "./wait-profile-store.js";
import { newWaitProfile } from "./wait-profile.js";

test("MemoryWaitProfileStore finds what it saved", () => {
  const store = newMemoryWaitProfileStore();
  const item = newWaitProfile("code-301", "name-318");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
