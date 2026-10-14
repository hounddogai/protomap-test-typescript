import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFrequencyRequestStore } from "./manual-frequency-request-store.js";
import { newManualFrequencyRequest } from "./manual-frequency-request.js";

test("MemoryManualFrequencyRequestStore finds what it saved", () => {
  const store = newMemoryManualFrequencyRequestStore();
  const item = newManualFrequencyRequest("code-183", "name-861");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
