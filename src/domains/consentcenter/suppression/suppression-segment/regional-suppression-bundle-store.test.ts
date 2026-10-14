import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSuppressionBundleStore } from "./regional-suppression-bundle-store.js";
import { newRegionalSuppressionBundle } from "./regional-suppression-bundle.js";

test("MemoryRegionalSuppressionBundleStore finds what it saved", () => {
  const store = newMemoryRegionalSuppressionBundleStore();
  const item = newRegionalSuppressionBundle("code-820", "title-789");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
