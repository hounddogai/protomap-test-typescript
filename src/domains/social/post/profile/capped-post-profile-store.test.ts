import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPostProfileStore } from "./capped-post-profile-store.js";
import { newCappedPostProfile } from "./capped-post-profile.js";

test("MemoryCappedPostProfileStore finds what it saved", () => {
  const store = newMemoryCappedPostProfileStore();
  const item = newCappedPostProfile("code-563", "title-392");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
