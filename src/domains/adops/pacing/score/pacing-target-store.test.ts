import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingTargetStore } from "./pacing-target-store.js";
import { newPacingTarget } from "./pacing-target.js";

test("MemoryPacingTargetStore finds what it saved", () => {
  const store = newMemoryPacingTargetStore();
  const item = newPacingTarget("code-440", "title-810");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
