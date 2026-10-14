import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySlaPlanStore } from "./primary-sla-plan-store.js";
import { newPrimarySlaPlan } from "./primary-sla-plan.js";

test("MemoryPrimarySlaPlanStore finds what it saved", () => {
  const store = newMemoryPrimarySlaPlanStore();
  const item = newPrimarySlaPlan("code-409", "name-505");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
