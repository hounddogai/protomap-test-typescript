import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyPolicyStore } from "./frequency-policy-store.js";
import { newFrequencyPolicy } from "./frequency-policy.js";

test("MemoryFrequencyPolicyStore finds what it saved", () => {
  const store = newMemoryFrequencyPolicyStore();
  const item = newFrequencyPolicy("code-261", "title-530");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
