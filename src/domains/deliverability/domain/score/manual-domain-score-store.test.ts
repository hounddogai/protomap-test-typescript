import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualDomainScoreStore } from "./manual-domain-score-store.js";
import { newManualDomainScore } from "./manual-domain-score.js";

test("MemoryManualDomainScoreStore finds what it saved", () => {
  const store = newMemoryManualDomainScoreStore();
  const item = newManualDomainScore("code-723", "title-748");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
