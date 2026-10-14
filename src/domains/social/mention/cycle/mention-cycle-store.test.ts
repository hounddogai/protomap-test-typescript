import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionCycleStore } from "./mention-cycle-store.js";
import { newMentionCycle } from "./mention-cycle.js";

test("MemoryMentionCycleStore finds what it saved", () => {
  const store = newMemoryMentionCycleStore();
  const item = newMentionCycle("code-662", "title-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
