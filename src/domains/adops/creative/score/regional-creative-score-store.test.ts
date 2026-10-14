import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCreativeScoreStore } from "./regional-creative-score-store.js";
import { newRegionalCreativeScore } from "./regional-creative-score.js";

test("MemoryRegionalCreativeScoreStore finds what it saved", () => {
  const store = newMemoryRegionalCreativeScoreStore();
  const item = newRegionalCreativeScore("code-152", "name-823");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
