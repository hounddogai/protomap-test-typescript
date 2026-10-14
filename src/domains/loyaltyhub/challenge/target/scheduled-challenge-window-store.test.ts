import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledChallengeWindowStore } from "./scheduled-challenge-window-store.js";
import { newScheduledChallengeWindow } from "./scheduled-challenge-window.js";

test("MemoryScheduledChallengeWindowStore finds what it saved", () => {
  const store = newMemoryScheduledChallengeWindowStore();
  const item = newScheduledChallengeWindow("code-31", "title-758");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
