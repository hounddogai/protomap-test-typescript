import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalInsightScoreStore } from "./regional-insight-score-store.js";
import { newRegionalInsightScore } from "./regional-insight-score.js";

test("MemoryRegionalInsightScoreStore finds what it saved", () => {
  const store = newMemoryRegionalInsightScoreStore();
  const item = newRegionalInsightScore("code-84", "label-469");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
