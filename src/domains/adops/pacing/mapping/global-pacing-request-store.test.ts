import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalPacingRequestStore } from "./global-pacing-request-store.js";
import { newGlobalPacingRequest } from "./global-pacing-request.js";

test("MemoryGlobalPacingRequestStore finds what it saved", () => {
  const store = newMemoryGlobalPacingRequestStore();
  const item = newGlobalPacingRequest("code-546", "label-496");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
