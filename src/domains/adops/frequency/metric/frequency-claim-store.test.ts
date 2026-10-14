import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyClaimStore } from "./frequency-claim-store.js";
import { newFrequencyClaim } from "./frequency-claim.js";

test("MemoryFrequencyClaimStore finds what it saved", () => {
  const store = newMemoryFrequencyClaimStore();
  const item = newFrequencyClaim("code-216", "title-886");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
