import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDoubleOptInBundleStore } from "./legacy-double-opt-in-bundle-store.js";
import { newLegacyDoubleOptInBundle } from "./legacy-double-opt-in-bundle.js";

test("MemoryLegacyDoubleOptInBundleStore finds what it saved", () => {
  const store = newMemoryLegacyDoubleOptInBundleStore();
  const item = newLegacyDoubleOptInBundle("code-863", "title-691");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
