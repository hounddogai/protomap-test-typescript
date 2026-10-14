import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionCycleStore } from "./deflection-cycle-store.js";
import { newDeflectionCycle } from "./deflection-cycle.js";

test("MemoryDeflectionCycleStore finds what it saved", () => {
  const store = newMemoryDeflectionCycleStore();
  const item = newDeflectionCycle("code-481", "label-858");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
