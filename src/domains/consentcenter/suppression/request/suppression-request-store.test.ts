import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionRequestStore } from "./suppression-request-store.js";
import { newSuppressionRequest } from "./suppression-request.js";

test("MemorySuppressionRequestStore finds what it saved", () => {
  const store = newMemorySuppressionRequestStore();
  const item = newSuppressionRequest("code-188", "label-440");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
