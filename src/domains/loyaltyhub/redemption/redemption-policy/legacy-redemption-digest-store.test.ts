import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyRedemptionDigestStore } from "./legacy-redemption-digest-store.js";
import { newLegacyRedemptionDigest } from "./legacy-redemption-digest.js";

test("MemoryLegacyRedemptionDigestStore finds what it saved", () => {
  const store = newMemoryLegacyRedemptionDigestStore();
  const item = newLegacyRedemptionDigest("code-306", "label-678");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
