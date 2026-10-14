import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPostOverrideStore } from "./weighted-post-override-store.js";
import { newWeightedPostOverride } from "./weighted-post-override.js";

test("MemoryWeightedPostOverrideStore finds what it saved", () => {
  const store = newMemoryWeightedPostOverrideStore();
  const item = newWeightedPostOverride("code-551", "name-785");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
