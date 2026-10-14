import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultCreditDigestStore } from "./default-credit-digest-store.js";
import { newDefaultCreditDigest } from "./default-credit-digest.js";

test("MemoryDefaultCreditDigestStore finds what it saved", () => {
  const store = newMemoryDefaultCreditDigestStore();
  const item = newDefaultCreditDigest("code-837", "label-513");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
