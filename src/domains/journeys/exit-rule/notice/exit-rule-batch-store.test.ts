import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleBatchStore } from "./exit-rule-batch-store.js";
import { newExitRuleBatch } from "./exit-rule-batch.js";

test("MemoryExitRuleBatchStore finds what it saved", () => {
  const store = newMemoryExitRuleBatchStore();
  const item = newExitRuleBatch("code-615", "name-210");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
