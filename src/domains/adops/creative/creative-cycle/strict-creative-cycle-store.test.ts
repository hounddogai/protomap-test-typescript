import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCreativeCycleStore } from "./strict-creative-cycle-store.js";
import { newStrictCreativeCycle } from "./strict-creative-cycle.js";

test("MemoryStrictCreativeCycleStore finds what it saved", () => {
  const store = newMemoryStrictCreativeCycleStore();
  const item = newStrictCreativeCycle("code-891", "title-516");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
