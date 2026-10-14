import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointBaselineStore } from "./touchpoint-baseline-store.js";
import { newTouchpointBaseline } from "./touchpoint-baseline.js";

test("MemoryTouchpointBaselineStore finds what it saved", () => {
  const store = newMemoryTouchpointBaselineStore();
  const item = newTouchpointBaseline("code-115", "name-244");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
