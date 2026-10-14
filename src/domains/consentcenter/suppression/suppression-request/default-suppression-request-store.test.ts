import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSuppressionRequestStore } from "./default-suppression-request-store.js";
import { newDefaultSuppressionRequest } from "./default-suppression-request.js";

test("MemoryDefaultSuppressionRequestStore finds what it saved", () => {
  const store = newMemoryDefaultSuppressionRequestStore();
  const item = newDefaultSuppressionRequest("code-383", "title-69");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
