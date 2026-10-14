import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeTargetStore } from "./creative-target-store.js";
import { newCreativeTarget } from "./creative-target.js";

test("MemoryCreativeTargetStore finds what it saved", () => {
  const store = newMemoryCreativeTargetStore();
  const item = newCreativeTarget("code-227", "label-265");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
