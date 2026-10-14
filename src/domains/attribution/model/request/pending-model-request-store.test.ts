import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingModelRequestStore } from "./pending-model-request-store.js";
import { newPendingModelRequest } from "./pending-model-request.js";

test("MemoryPendingModelRequestStore finds what it saved", () => {
  const store = newMemoryPendingModelRequestStore();
  const item = newPendingModelRequest("code-917", "title-913");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
