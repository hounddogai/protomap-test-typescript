import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalBounceScoreStore } from "./regional-bounce-score-store.js";
import { newRegionalBounceScore } from "./regional-bounce-score.js";

test("MemoryRegionalBounceScoreStore finds what it saved", () => {
  const store = newMemoryRegionalBounceScoreStore();
  const item = newRegionalBounceScore("code-229", "title-125");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
