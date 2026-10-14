import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueProfileStore } from "./queue-profile-store.js";
import { newQueueProfile } from "./queue-profile.js";

test("MemoryQueueProfileStore finds what it saved", () => {
  const store = newMemoryQueueProfileStore();
  const item = newQueueProfile("code-855", "title-526");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
