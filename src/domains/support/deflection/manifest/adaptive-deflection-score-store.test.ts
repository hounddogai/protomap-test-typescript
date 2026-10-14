import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDeflectionScoreStore } from "./adaptive-deflection-score-store.js";
import { newAdaptiveDeflectionScore } from "./adaptive-deflection-score.js";

test("MemoryAdaptiveDeflectionScoreStore finds what it saved", () => {
  const store = newMemoryAdaptiveDeflectionScoreStore();
  const item = newAdaptiveDeflectionScore("code-529", "title-690");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
