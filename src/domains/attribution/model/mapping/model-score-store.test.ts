import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelScoreStore } from "./model-score-store.js";
import { newModelScore } from "./model-score.js";

test("MemoryModelScoreStore finds what it saved", () => {
  const store = newMemoryModelScoreStore();
  const item = newModelScore("code-300", "label-528");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
