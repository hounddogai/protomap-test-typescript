import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedActivationDigestStore } from "./weighted-activation-digest-store.js";
import { newWeightedActivationDigest } from "./weighted-activation-digest.js";

test("MemoryWeightedActivationDigestStore finds what it saved", () => {
  const store = newMemoryWeightedActivationDigestStore();
  const item = newWeightedActivationDigest("code-575", "label-98");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
