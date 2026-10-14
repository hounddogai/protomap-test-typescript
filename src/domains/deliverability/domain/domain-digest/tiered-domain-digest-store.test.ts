import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDomainDigestStore } from "./tiered-domain-digest-store.js";
import { newTieredDomainDigest } from "./tiered-domain-digest.js";

test("MemoryTieredDomainDigestStore finds what it saved", () => {
  const store = newMemoryTieredDomainDigestStore();
  const item = newTieredDomainDigest("code-223", "label-614");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
