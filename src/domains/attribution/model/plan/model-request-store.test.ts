import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelRequestStore } from "./model-request-store.js";
import { newModelRequest } from "./model-request.js";

test("MemoryModelRequestStore finds what it saved", () => {
  const store = newMemoryModelRequestStore();
  const item = newModelRequest("code-93", "label-647");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
