import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledTouchpointBaselineStore } from "./scheduled-touchpoint-baseline-store.js";
import { newScheduledTouchpointBaseline } from "./scheduled-touchpoint-baseline.js";

test("MemoryScheduledTouchpointBaselineStore finds what it saved", () => {
  const store = newMemoryScheduledTouchpointBaselineStore();
  const item = newScheduledTouchpointBaseline("code-217", "label-288");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
