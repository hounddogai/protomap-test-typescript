import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFrequencyClaimStore } from "./scheduled-frequency-claim-store.js";
import { newScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

test("MemoryScheduledFrequencyClaimStore finds what it saved", () => {
  const store = newMemoryScheduledFrequencyClaimStore();
  const item = newScheduledFrequencyClaim("code-166", "label-406");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
