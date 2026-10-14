import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPostRollupStore } from "./rolling-post-rollup-store.js";
import { newRollingPostRollup } from "./rolling-post-rollup.js";

test("MemoryRollingPostRollupStore finds what it saved", () => {
  const store = newMemoryRollingPostRollupStore();
  const item = newRollingPostRollup("code-544", "label-844");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
