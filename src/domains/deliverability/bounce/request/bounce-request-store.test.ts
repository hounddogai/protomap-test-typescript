import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceRequestStore } from "./bounce-request-store.js";
import { newBounceRequest } from "./bounce-request.js";

test("MemoryBounceRequestStore finds what it saved", () => {
  const store = newMemoryBounceRequestStore();
  const item = newBounceRequest("code-942", "title-167");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
