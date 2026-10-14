import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakGroupStore } from "./streak-group-store.js";
import { newStreakGroup } from "./streak-group.js";

test("MemoryStreakGroupStore finds what it saved", () => {
  const store = newMemoryStreakGroupStore();
  const item = newStreakGroup("code-694", "title-45");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
