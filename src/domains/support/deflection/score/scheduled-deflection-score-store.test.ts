import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDeflectionScoreStore } from "./scheduled-deflection-score-store.js";
import { newScheduledDeflectionScore } from "./scheduled-deflection-score.js";

test("MemoryScheduledDeflectionScoreStore finds what it saved", () => {
  const store = newMemoryScheduledDeflectionScoreStore();
  const item = newScheduledDeflectionScore("code-533", "label-303");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
