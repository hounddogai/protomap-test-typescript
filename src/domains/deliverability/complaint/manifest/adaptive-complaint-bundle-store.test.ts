import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveComplaintBundleStore } from "./adaptive-complaint-bundle-store.js";
import { newAdaptiveComplaintBundle } from "./adaptive-complaint-bundle.js";

test("MemoryAdaptiveComplaintBundleStore finds what it saved", () => {
  const store = newMemoryAdaptiveComplaintBundleStore();
  const item = newAdaptiveComplaintBundle("code-51", "name-419");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
