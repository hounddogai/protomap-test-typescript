import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveChallengeBatchStore } from "./adaptive-challenge-batch-store.js";
import { newAdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

test("MemoryAdaptiveChallengeBatchStore finds what it saved", () => {
  const store = newMemoryAdaptiveChallengeBatchStore();
  const item = newAdaptiveChallengeBatch("code-277", "label-725");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
