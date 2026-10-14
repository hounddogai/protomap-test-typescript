import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualStreakExceptionStore } from "./manual-streak-exception-store.js";
import { newManualStreakException } from "./manual-streak-exception.js";

test("MemoryManualStreakExceptionStore finds what it saved", () => {
  const store = newMemoryManualStreakExceptionStore();
  const item = newManualStreakException("code-428", "name-397");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
