import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPacingTargetStore } from "./default-pacing-target-store.js";
import { newDefaultPacingTarget } from "./default-pacing-target.js";

test("MemoryDefaultPacingTargetStore finds what it saved", () => {
  const store = newMemoryDefaultPacingTargetStore();
  const item = newDefaultPacingTarget("code-577", "label-948");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
