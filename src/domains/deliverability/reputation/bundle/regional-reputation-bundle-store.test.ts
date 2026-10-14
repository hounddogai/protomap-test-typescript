import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalReputationBundleStore } from "./regional-reputation-bundle-store.js";
import { newRegionalReputationBundle } from "./regional-reputation-bundle.js";

test("MemoryRegionalReputationBundleStore finds what it saved", () => {
  const store = newMemoryRegionalReputationBundleStore();
  const item = newRegionalReputationBundle("code-615", "title-278");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
