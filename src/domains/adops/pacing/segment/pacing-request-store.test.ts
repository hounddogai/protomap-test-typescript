import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingRequestStore } from "./pacing-request-store.js";
import { newPacingRequest } from "./pacing-request.js";

test("MemoryPacingRequestStore finds what it saved", () => {
  const store = newMemoryPacingRequestStore();
  const item = newPacingRequest("code-803", "label-446");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
