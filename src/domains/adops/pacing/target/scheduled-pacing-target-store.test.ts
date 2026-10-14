import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPacingTargetStore } from "./scheduled-pacing-target-store.js";
import { newScheduledPacingTarget } from "./scheduled-pacing-target.js";

test("MemoryScheduledPacingTargetStore finds what it saved", () => {
  const store = newMemoryScheduledPacingTargetStore();
  const item = newScheduledPacingTarget("code-148", "title-782");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
