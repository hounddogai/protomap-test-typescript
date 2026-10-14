import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalOptOutBundleStore } from "./regional-opt-out-bundle-store.js";
import { newRegionalOptOutBundle } from "./regional-opt-out-bundle.js";

test("MemoryRegionalOptOutBundleStore finds what it saved", () => {
  const store = newMemoryRegionalOptOutBundleStore();
  const item = newRegionalOptOutBundle("code-172", "name-186");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
