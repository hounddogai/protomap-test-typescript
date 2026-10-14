import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelRollupStore } from "./funnel-rollup-store.js";
import { newFunnelRollup } from "./funnel-rollup.js";

test("MemoryFunnelRollupStore finds what it saved", () => {
  const store = newMemoryFunnelRollupStore();
  const item = newFunnelRollup("code-493", "name-488");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
