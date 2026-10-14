import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditDigestStore } from "./credit-digest-store.js";
import { newCreditDigest } from "./credit-digest.js";

test("MemoryCreditDigestStore finds what it saved", () => {
  const store = newMemoryCreditDigestStore();
  const item = newCreditDigest("code-916", "name-457");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
