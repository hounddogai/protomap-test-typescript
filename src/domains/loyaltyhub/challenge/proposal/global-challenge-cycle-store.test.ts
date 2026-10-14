import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalChallengeCycleStore } from "./global-challenge-cycle-store.js";
import { newGlobalChallengeCycle } from "./global-challenge-cycle.js";

test("MemoryGlobalChallengeCycleStore finds what it saved", () => {
  const store = newMemoryGlobalChallengeCycleStore();
  const item = newGlobalChallengeCycle("code-89", "title-392");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
