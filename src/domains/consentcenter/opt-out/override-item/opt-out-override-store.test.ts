import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutOverrideStore } from "./opt-out-override-store.js";
import { newOptOutOverride } from "./opt-out-override.js";

test("MemoryOptOutOverrideStore finds what it saved", () => {
  const store = newMemoryOptOutOverrideStore();
  const item = newOptOutOverride("code-536", "title-69");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
