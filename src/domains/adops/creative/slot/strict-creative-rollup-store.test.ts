import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCreativeRollupStore } from "./strict-creative-rollup-store.js";
import { newStrictCreativeRollup } from "./strict-creative-rollup.js";

test("MemoryStrictCreativeRollupStore finds what it saved", () => {
  const store = newMemoryStrictCreativeRollupStore();
  const item = newStrictCreativeRollup("code-861", "label-44");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
