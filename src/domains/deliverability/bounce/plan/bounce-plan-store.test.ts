import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBouncePlanStore } from "./bounce-plan-store.js";
import { newBouncePlan } from "./bounce-plan.js";

test("MemoryBouncePlanStore finds what it saved", () => {
  const store = newMemoryBouncePlanStore();
  const item = newBouncePlan("code-472", "name-693");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
