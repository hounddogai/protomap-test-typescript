import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedOptOutProfileStore } from "./weighted-opt-out-profile-store.js";
import { newWeightedOptOutProfile } from "./weighted-opt-out-profile.js";

test("MemoryWeightedOptOutProfileStore finds what it saved", () => {
  const store = newMemoryWeightedOptOutProfileStore();
  const item = newWeightedOptOutProfile("code-288", "label-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
