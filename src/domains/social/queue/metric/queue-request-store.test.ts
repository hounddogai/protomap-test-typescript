import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueRequestStore } from "./queue-request-store.js";
import { newQueueRequest } from "./queue-request.js";

test("MemoryQueueRequestStore finds what it saved", () => {
  const store = newMemoryQueueRequestStore();
  const item = newQueueRequest("code-602", "name-825");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
