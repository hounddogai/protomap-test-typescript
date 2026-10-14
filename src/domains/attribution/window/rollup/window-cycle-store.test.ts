import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowCycleStore } from "./window-cycle-store.js";
import { newWindowCycle } from "./window-cycle.js";

test("MemoryWindowCycleStore finds what it saved", () => {
  const store = newMemoryWindowCycleStore();
  const item = newWindowCycle("code-648", "title-592");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
