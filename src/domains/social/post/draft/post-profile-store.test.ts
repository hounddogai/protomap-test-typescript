import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostProfileStore } from "./post-profile-store.js";
import { newPostProfile } from "./post-profile.js";

test("MemoryPostProfileStore finds what it saved", () => {
  const store = newMemoryPostProfileStore();
  const item = newPostProfile("code-28", "label-594");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
