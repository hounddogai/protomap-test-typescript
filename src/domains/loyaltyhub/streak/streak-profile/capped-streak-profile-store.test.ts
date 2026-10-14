import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedStreakProfileStore } from "./capped-streak-profile-store.js";
import { newCappedStreakProfile } from "./capped-streak-profile.js";

test("MemoryCappedStreakProfileStore finds what it saved", () => {
  const store = newMemoryCappedStreakProfileStore();
  const item = newCappedStreakProfile("code-911", "label-151");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
