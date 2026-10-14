import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceCycleStore } from "./bounce-cycle-store.js";
import { newBounceCycle } from "./bounce-cycle.js";

test("MemoryBounceCycleStore finds what it saved", () => {
  const store = newMemoryBounceCycleStore();
  const item = newBounceCycle("code-115", "label-180");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
