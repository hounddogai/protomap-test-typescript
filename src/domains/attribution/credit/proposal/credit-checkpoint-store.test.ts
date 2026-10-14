import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditCheckpointStore } from "./credit-checkpoint-store.js";
import { newCreditCheckpoint } from "./credit-checkpoint.js";

test("MemoryCreditCheckpointStore finds what it saved", () => {
  const store = newMemoryCreditCheckpointStore();
  const item = newCreditCheckpoint("code-925", "name-804");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
