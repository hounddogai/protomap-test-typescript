import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualChallengeBatchStore } from "./manual-challenge-batch-store.js";
import { newManualChallengeBatch } from "./manual-challenge-batch.js";

test("MemoryManualChallengeBatchStore finds what it saved", () => {
  const store = newMemoryManualChallengeBatchStore();
  const item = newManualChallengeBatch("code-674", "title-615");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
