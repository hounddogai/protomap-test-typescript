import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPacingTargetStore } from "./pending-pacing-target-store.js";
import { newPendingPacingTarget } from "./pending-pacing-target.js";

test("MemoryPendingPacingTargetStore finds what it saved", () => {
  const store = newMemoryPendingPacingTargetStore();
  const item = newPendingPacingTarget("code-322", "name-792");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
