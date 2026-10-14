import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderCycleStore } from "./sender-cycle-store.js";
import { newSenderCycle } from "./sender-cycle.js";

test("MemorySenderCycleStore finds what it saved", () => {
  const store = newMemorySenderCycleStore();
  const item = newSenderCycle("code-243", "name-162");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
