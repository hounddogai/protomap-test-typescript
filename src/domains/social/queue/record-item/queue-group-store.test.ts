import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueGroupStore } from "./queue-group-store.js";
import { newQueueGroup } from "./queue-group.js";

test("MemoryQueueGroupStore finds what it saved", () => {
  const store = newMemoryQueueGroupStore();
  const item = newQueueGroup("code-162", "label-244");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
