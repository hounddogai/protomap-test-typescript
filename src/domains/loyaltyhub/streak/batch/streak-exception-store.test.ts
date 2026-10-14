import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakExceptionStore } from "./streak-exception-store.js";
import { newStreakException } from "./streak-exception.js";

test("MemoryStreakExceptionStore finds what it saved", () => {
  const store = newMemoryStreakExceptionStore();
  const item = newStreakException("code-926", "name-75");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
