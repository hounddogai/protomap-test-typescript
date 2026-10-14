import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeCycleStore } from "./creative-cycle-store.js";
import { newCreativeCycle } from "./creative-cycle.js";

test("MemoryCreativeCycleStore finds what it saved", () => {
  const store = newMemoryCreativeCycleStore();
  const item = newCreativeCycle("code-567", "name-906");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
