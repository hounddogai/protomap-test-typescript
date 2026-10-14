import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelTargetStore } from "./level-target-store.js";
import { newLevelTarget } from "./level-target.js";

test("MemoryLevelTargetStore finds what it saved", () => {
  const store = newMemoryLevelTargetStore();
  const item = newLevelTarget("code-619", "label-589");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
