import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPostProfileStore } from "./primary-post-profile-store.js";
import { newPrimaryPostProfile } from "./primary-post-profile.js";

test("MemoryPrimaryPostProfileStore finds what it saved", () => {
  const store = newMemoryPrimaryPostProfileStore();
  const item = newPrimaryPostProfile("code-475", "name-615");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
