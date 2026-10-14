import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingOptOutProfileStore } from "./pending-opt-out-profile-store.js";
import { newPendingOptOutProfile } from "./pending-opt-out-profile.js";

test("MemoryPendingOptOutProfileStore finds what it saved", () => {
  const store = newMemoryPendingOptOutProfileStore();
  const item = newPendingOptOutProfile("code-269", "name-299");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
