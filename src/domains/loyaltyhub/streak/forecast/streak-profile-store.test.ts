import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakProfileStore } from "./streak-profile-store.js";
import { newStreakProfile } from "./streak-profile.js";

test("MemoryStreakProfileStore finds what it saved", () => {
  const store = newMemoryStreakProfileStore();
  const item = newStreakProfile("code-450", "label-921");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
