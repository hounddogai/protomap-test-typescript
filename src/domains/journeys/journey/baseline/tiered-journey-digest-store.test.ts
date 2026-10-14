import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredJourneyDigestStore } from "./tiered-journey-digest-store.js";
import { newTieredJourneyDigest } from "./tiered-journey-digest.js";

test("MemoryTieredJourneyDigestStore finds what it saved", () => {
  const store = newMemoryTieredJourneyDigestStore();
  const item = newTieredJourneyDigest("code-783", "label-480");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
