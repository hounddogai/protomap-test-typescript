import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathTargetStore } from "./path-target-store.js";
import { newPathTarget } from "./path-target.js";

test("MemoryPathTargetStore finds what it saved", () => {
  const store = newMemoryPathTargetStore();
  const item = newPathTarget("code-518", "name-892");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
