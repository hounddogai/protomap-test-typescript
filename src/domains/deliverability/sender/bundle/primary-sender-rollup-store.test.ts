import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySenderRollupStore } from "./primary-sender-rollup-store.js";
import { newPrimarySenderRollup } from "./primary-sender-rollup.js";

test("MemoryPrimarySenderRollupStore finds what it saved", () => {
  const store = newMemoryPrimarySenderRollupStore();
  const item = newPrimarySenderRollup("code-145", "name-779");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
