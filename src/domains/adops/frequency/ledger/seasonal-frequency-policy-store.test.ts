import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalFrequencyPolicyStore } from "./seasonal-frequency-policy-store.js";
import { newSeasonalFrequencyPolicy } from "./seasonal-frequency-policy.js";

test("MemorySeasonalFrequencyPolicyStore finds what it saved", () => {
  const store = newMemorySeasonalFrequencyPolicyStore();
  const item = newSeasonalFrequencyPolicy("code-142", "label-51");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
