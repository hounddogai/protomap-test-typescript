import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationDigestStore } from "./reputation-digest-store.js";
import { newReputationDigest } from "./reputation-digest.js";

test("MemoryReputationDigestStore finds what it saved", () => {
  const store = newMemoryReputationDigestStore();
  const item = newReputationDigest("code-578", "label-682");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
