import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakRequestStore } from "./streak-request-store.js";
import { newStreakRequest } from "./streak-request.js";

test("MemoryStreakRequestStore finds what it saved", () => {
  const store = newMemoryStreakRequestStore();
  const item = newStreakRequest("code-871", "title-518");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
