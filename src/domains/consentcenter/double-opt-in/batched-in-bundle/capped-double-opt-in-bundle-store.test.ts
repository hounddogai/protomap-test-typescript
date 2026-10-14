import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedDoubleOptInBundleStore } from "./capped-double-opt-in-bundle-store.js";
import { newCappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

test("MemoryCappedDoubleOptInBundleStore finds what it saved", () => {
  const store = newMemoryCappedDoubleOptInBundleStore();
  const item = newCappedDoubleOptInBundle("code-956", "title-894");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
