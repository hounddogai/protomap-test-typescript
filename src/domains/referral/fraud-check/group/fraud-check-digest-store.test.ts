import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckDigestStore } from "./fraud-check-digest-store.js";
import { newFraudCheckDigest } from "./fraud-check-digest.js";

test("MemoryFraudCheckDigestStore finds what it saved", () => {
  const store = newMemoryFraudCheckDigestStore();
  const item = newFraudCheckDigest("code-835", "name-391");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
