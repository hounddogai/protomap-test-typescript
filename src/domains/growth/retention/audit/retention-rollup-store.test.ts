import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionRollupStore } from "./retention-rollup-store.js";
import { newRetentionRollup } from "./retention-rollup.js";

test("MemoryRetentionRollupStore finds what it saved", () => {
  const store = newMemoryRetentionRollupStore();
  const item = newRetentionRollup("code-745", "name-743");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
