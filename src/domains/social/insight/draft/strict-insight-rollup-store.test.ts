import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictInsightRollupStore } from "./strict-insight-rollup-store.js";
import { newStrictInsightRollup } from "./strict-insight-rollup.js";

test("MemoryStrictInsightRollupStore finds what it saved", () => {
  const store = newMemoryStrictInsightRollupStore();
  const item = newStrictInsightRollup("code-160", "label-233");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
