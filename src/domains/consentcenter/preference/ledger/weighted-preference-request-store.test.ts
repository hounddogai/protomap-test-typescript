import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPreferenceRequestStore } from "./weighted-preference-request-store.js";
import { newWeightedPreferenceRequest } from "./weighted-preference-request.js";

test("MemoryWeightedPreferenceRequestStore finds what it saved", () => {
  const store = newMemoryWeightedPreferenceRequestStore();
  const item = newWeightedPreferenceRequest("code-415", "name-282");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
