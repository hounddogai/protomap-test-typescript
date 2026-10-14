import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledWaitRequestStore } from "./scheduled-wait-request-store.js";
import { newScheduledWaitRequest } from "./scheduled-wait-request.js";

test("MemoryScheduledWaitRequestStore finds what it saved", () => {
  const store = newMemoryScheduledWaitRequestStore();
  const item = newScheduledWaitRequest("code-803", "label-23");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
