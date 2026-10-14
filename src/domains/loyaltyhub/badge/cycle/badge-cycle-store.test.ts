import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeCycleStore } from "./badge-cycle-store.js";
import { newBadgeCycle } from "./badge-cycle.js";

test("MemoryBadgeCycleStore finds what it saved", () => {
  const store = newMemoryBadgeCycleStore();
  const item = newBadgeCycle("code-162", "label-40");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
