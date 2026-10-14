import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientDomainScoreStore } from "./lenient-domain-score-store.js";
import { newLenientDomainScore } from "./lenient-domain-score.js";

test("MemoryLenientDomainScoreStore finds what it saved", () => {
  const store = newMemoryLenientDomainScoreStore();
  const item = newLenientDomainScore("code-208", "label-987");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
