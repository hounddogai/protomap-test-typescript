import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFlightScoreStore } from "./scheduled-flight-score-store.js";
import { newScheduledFlightScore } from "./scheduled-flight-score.js";

test("MemoryScheduledFlightScoreStore finds what it saved", () => {
  const store = newMemoryScheduledFlightScoreStore();
  const item = newScheduledFlightScore("code-543", "title-373");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
