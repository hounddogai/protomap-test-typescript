import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointExceptionStore } from "./touchpoint-exception-store.js";
import { newTouchpointException } from "./touchpoint-exception.js";

test("MemoryTouchpointExceptionStore finds what it saved", () => {
  const store = newMemoryTouchpointExceptionStore();
  const item = newTouchpointException("code-884", "label-18");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
