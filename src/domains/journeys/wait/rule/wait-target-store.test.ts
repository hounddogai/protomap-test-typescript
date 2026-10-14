import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitTargetStore } from "./wait-target-store.js";
import { newWaitTarget } from "./wait-target.js";

test("MemoryWaitTargetStore finds what it saved", () => {
  const store = newMemoryWaitTargetStore();
  const item = newWaitTarget("code-342", "name-665");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
