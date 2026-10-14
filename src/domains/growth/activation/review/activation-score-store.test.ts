import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationScoreStore } from "./activation-score-store.js";
import { newActivationScore } from "./activation-score.js";

test("MemoryActivationScoreStore finds what it saved", () => {
  const store = newMemoryActivationScoreStore();
  const item = newActivationScore("code-913", "label-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
