import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatCycleStore } from "./csat-cycle-store.js";
import { newCsatCycle } from "./csat-cycle.js";

test("MemoryCsatCycleStore finds what it saved", () => {
  const store = newMemoryCsatCycleStore();
  const item = newCsatCycle("code-684", "name-80");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
