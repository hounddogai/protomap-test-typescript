import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintCycleStore } from "./complaint-cycle-store.js";
import { newComplaintCycle } from "./complaint-cycle.js";

test("MemoryComplaintCycleStore finds what it saved", () => {
  const store = newMemoryComplaintCycleStore();
  const item = newComplaintCycle("code-102", "label-525");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
