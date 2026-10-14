import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPacingTargetStore } from "./tiered-pacing-target-store.js";
import { newTieredPacingTarget } from "./tiered-pacing-target.js";

test("MemoryTieredPacingTargetStore finds what it saved", () => {
  const store = newMemoryTieredPacingTargetStore();
  const item = newTieredPacingTarget("code-74", "title-802");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
