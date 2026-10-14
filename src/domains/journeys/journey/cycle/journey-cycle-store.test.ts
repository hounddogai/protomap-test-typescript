import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyCycleStore } from "./journey-cycle-store.js";
import { newJourneyCycle } from "./journey-cycle.js";

test("MemoryJourneyCycleStore finds what it saved", () => {
  const store = newMemoryJourneyCycleStore();
  const item = newJourneyCycle("code-657", "label-597");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
