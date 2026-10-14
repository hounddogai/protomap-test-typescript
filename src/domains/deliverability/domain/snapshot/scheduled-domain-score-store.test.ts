import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDomainScoreStore } from "./scheduled-domain-score-store.js";
import { newScheduledDomainScore } from "./scheduled-domain-score.js";

test("MemoryScheduledDomainScoreStore finds what it saved", () => {
  const store = newMemoryScheduledDomainScoreStore();
  const item = newScheduledDomainScore("code-932", "label-519");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
