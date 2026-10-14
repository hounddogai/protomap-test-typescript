import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaRollupStore } from "./sla-rollup-store.js";
import { newSlaRollup } from "./sla-rollup.js";

test("MemorySlaRollupStore finds what it saved", () => {
  const store = newMemorySlaRollupStore();
  const item = newSlaRollup("code-715", "label-270");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
