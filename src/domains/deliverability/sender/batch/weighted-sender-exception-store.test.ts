import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedSenderExceptionStore } from "./weighted-sender-exception-store.js";
import { newWeightedSenderException } from "./weighted-sender-exception.js";

test("MemoryWeightedSenderExceptionStore finds what it saved", () => {
  const store = newMemoryWeightedSenderExceptionStore();
  const item = newWeightedSenderException("code-520", "label-358");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
