import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionBundleStore } from "./suppression-bundle-store.js";
import { newSuppressionBundle } from "./suppression-bundle.js";

test("MemorySuppressionBundleStore finds what it saved", () => {
  const store = newMemorySuppressionBundleStore();
  const item = newSuppressionBundle("code-464", "name-638");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
