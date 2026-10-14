import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPostProfileStore } from "./batched-post-profile-store.js";
import { newBatchedPostProfile } from "./batched-post-profile.js";

test("MemoryBatchedPostProfileStore finds what it saved", () => {
  const store = newMemoryBatchedPostProfileStore();
  const item = newBatchedPostProfile("code-439", "title-584");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
