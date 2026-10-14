import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueBundleStore } from "./queue-bundle-store.js";
import { newQueueBundle } from "./queue-bundle.js";

test("MemoryQueueBundleStore finds what it saved", () => {
  const store = newMemoryQueueBundleStore();
  const item = newQueueBundle("code-273", "title-36");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
