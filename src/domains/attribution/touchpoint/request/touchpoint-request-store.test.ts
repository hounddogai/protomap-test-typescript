import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointRequestStore } from "./touchpoint-request-store.js";
import { newTouchpointRequest } from "./touchpoint-request.js";

test("MemoryTouchpointRequestStore finds what it saved", () => {
  const store = newMemoryTouchpointRequestStore();
  const item = newTouchpointRequest("code-139", "name-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
