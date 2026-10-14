import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathCycleStore } from "./path-cycle-store.js";
import { newPathCycle } from "./path-cycle.js";

test("MemoryPathCycleStore finds what it saved", () => {
  const store = newMemoryPathCycleStore();
  const item = newPathCycle("code-285", "name-331");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
