import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPacingAdjustmentStore } from "./strict-pacing-adjustment-store.js";
import { newStrictPacingAdjustment } from "./strict-pacing-adjustment.js";

test("MemoryStrictPacingAdjustmentStore finds what it saved", () => {
  const store = newMemoryStrictPacingAdjustmentStore();
  const item = newStrictPacingAdjustment("code-513", "name-827");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
