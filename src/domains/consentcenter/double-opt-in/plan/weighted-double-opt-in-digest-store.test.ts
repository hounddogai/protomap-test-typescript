import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedDoubleOptInDigestStore } from "./weighted-double-opt-in-digest-store.js";
import { newWeightedDoubleOptInDigest } from "./weighted-double-opt-in-digest.js";

test("MemoryWeightedDoubleOptInDigestStore finds what it saved", () => {
  const store = newMemoryWeightedDoubleOptInDigestStore();
  const item = newWeightedDoubleOptInDigest("code-586", "name-412");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
