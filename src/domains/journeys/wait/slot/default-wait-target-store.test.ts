import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultWaitTargetStore } from "./default-wait-target-store.js";
import { newDefaultWaitTarget } from "./default-wait-target.js";

test("MemoryDefaultWaitTargetStore finds what it saved", () => {
  const store = newMemoryDefaultWaitTargetStore();
  const item = newDefaultWaitTarget("code-105", "label-574");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
