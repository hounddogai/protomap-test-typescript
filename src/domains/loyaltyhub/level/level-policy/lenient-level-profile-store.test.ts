import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientLevelProfileStore } from "./lenient-level-profile-store.js";
import { newLenientLevelProfile } from "./lenient-level-profile.js";

test("MemoryLenientLevelProfileStore finds what it saved", () => {
  const store = newMemoryLenientLevelProfileStore();
  const item = newLenientLevelProfile("code-846", "name-875");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
