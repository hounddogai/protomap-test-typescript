import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDomainScoreStore } from "./adaptive-domain-score-store.js";
import { newAdaptiveDomainScore } from "./adaptive-domain-score.js";

test("MemoryAdaptiveDomainScoreStore finds what it saved", () => {
  const store = newMemoryAdaptiveDomainScoreStore();
  const item = newAdaptiveDomainScore("code-362", "name-173");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
