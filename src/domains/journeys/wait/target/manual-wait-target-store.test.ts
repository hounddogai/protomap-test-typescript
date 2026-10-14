import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualWaitTargetStore } from "./manual-wait-target-store.js";
import { newManualWaitTarget } from "./manual-wait-target.js";

test("MemoryManualWaitTargetStore finds what it saved", () => {
  const store = newMemoryManualWaitTargetStore();
  const item = newManualWaitTarget("code-223", "name-320");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
