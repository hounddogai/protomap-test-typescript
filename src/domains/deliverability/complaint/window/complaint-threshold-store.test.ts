import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintThresholdStore } from "./complaint-threshold-store.js";
import { newComplaintThreshold } from "./complaint-threshold.js";

test("MemoryComplaintThresholdStore finds what it saved", () => {
  const store = newMemoryComplaintThresholdStore();
  const item = newComplaintThreshold("code-427", "label-560");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
