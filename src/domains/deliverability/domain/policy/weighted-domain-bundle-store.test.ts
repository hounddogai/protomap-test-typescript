import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedDomainBundleStore } from "./weighted-domain-bundle-store.js";
import { newWeightedDomainBundle } from "./weighted-domain-bundle.js";

test("MemoryWeightedDomainBundleStore finds what it saved", () => {
  const store = newMemoryWeightedDomainBundleStore();
  const item = newWeightedDomainBundle("code-673", "title-704");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
