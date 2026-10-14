import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingBounceRequestStore } from "./rolling-bounce-request-store.js";
import { newRollingBounceRequest } from "./rolling-bounce-request.js";

test("MemoryRollingBounceRequestStore finds what it saved", () => {
  const store = newMemoryRollingBounceRequestStore();
  const item = newRollingBounceRequest("code-132", "label-451");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
