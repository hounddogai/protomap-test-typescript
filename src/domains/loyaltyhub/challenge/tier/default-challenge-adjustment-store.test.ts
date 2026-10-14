import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultChallengeAdjustmentStore } from "./default-challenge-adjustment-store.js";
import { newDefaultChallengeAdjustment } from "./default-challenge-adjustment.js";

test("MemoryDefaultChallengeAdjustmentStore finds what it saved", () => {
  const store = newMemoryDefaultChallengeAdjustmentStore();
  const item = newDefaultChallengeAdjustment("code-917", "name-639");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
