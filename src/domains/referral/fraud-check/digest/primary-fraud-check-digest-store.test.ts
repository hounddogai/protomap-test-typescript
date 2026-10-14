import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFraudCheckDigestStore } from "./primary-fraud-check-digest-store.js";
import { newPrimaryFraudCheckDigest } from "./primary-fraud-check-digest.js";

test("MemoryPrimaryFraudCheckDigestStore finds what it saved", () => {
  const store = newMemoryPrimaryFraudCheckDigestStore();
  const item = newPrimaryFraudCheckDigest("code-512", "name-128");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
