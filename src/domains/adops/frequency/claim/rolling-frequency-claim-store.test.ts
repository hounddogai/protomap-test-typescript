import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFrequencyClaimStore } from "./rolling-frequency-claim-store.js";
import { newRollingFrequencyClaim } from "./rolling-frequency-claim.js";

test("MemoryRollingFrequencyClaimStore finds what it saved", () => {
  const store = newMemoryRollingFrequencyClaimStore();
  const item = newRollingFrequencyClaim("code-935", "name-694");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
