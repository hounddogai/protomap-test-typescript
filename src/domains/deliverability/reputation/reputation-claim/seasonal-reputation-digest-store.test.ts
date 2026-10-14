import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalReputationDigestStore } from "./seasonal-reputation-digest-store.js";
import { newSeasonalReputationDigest } from "./seasonal-reputation-digest.js";

test("MemorySeasonalReputationDigestStore finds what it saved", () => {
  const store = newMemorySeasonalReputationDigestStore();
  const item = newSeasonalReputationDigest("code-492", "title-389");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
