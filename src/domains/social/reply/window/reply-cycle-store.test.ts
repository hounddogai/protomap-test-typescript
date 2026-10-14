import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyCycleStore } from "./reply-cycle-store.js";
import { newReplyCycle } from "./reply-cycle.js";

test("MemoryReplyCycleStore finds what it saved", () => {
  const store = newMemoryReplyCycleStore();
  const item = newReplyCycle("code-546", "name-608");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
