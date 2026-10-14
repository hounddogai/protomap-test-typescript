import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedCreditDigestStore } from "./weighted-credit-digest-store.js";
import { newWeightedCreditDigest } from "./weighted-credit-digest.js";

test("MemoryWeightedCreditDigestStore finds what it saved", () => {
  const store = newMemoryWeightedCreditDigestStore();
  const item = newWeightedCreditDigest("code-24", "title-117");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
