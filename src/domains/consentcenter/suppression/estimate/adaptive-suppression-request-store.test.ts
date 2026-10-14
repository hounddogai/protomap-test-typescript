import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveSuppressionRequestStore } from "./adaptive-suppression-request-store.js";
import { newAdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

test("MemoryAdaptiveSuppressionRequestStore finds what it saved", () => {
  const store = newMemoryAdaptiveSuppressionRequestStore();
  const item = newAdaptiveSuppressionRequest("code-365", "title-401");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
