import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintBundleStore } from "./complaint-bundle-store.js";
import { newComplaintBundle } from "./complaint-bundle.js";

test("MemoryComplaintBundleStore finds what it saved", () => {
  const store = newMemoryComplaintBundleStore();
  const item = newComplaintBundle("code-634", "name-166");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
