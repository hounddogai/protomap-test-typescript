import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingDoubleOptInRollupStore } from "./pending-double-opt-in-rollup-store.js";
import { newPendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

test("MemoryPendingDoubleOptInRollupStore finds what it saved", () => {
  const store = newMemoryPendingDoubleOptInRollupStore();
  const item = newPendingDoubleOptInRollup("code-326", "title-612");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
