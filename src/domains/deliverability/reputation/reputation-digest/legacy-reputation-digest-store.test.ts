import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyReputationDigestStore } from "./legacy-reputation-digest-store.js";
import { newLegacyReputationDigest } from "./legacy-reputation-digest.js";

test("MemoryLegacyReputationDigestStore finds what it saved", () => {
  const store = newMemoryLegacyReputationDigestStore();
  const item = newLegacyReputationDigest("code-830", "label-59");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
