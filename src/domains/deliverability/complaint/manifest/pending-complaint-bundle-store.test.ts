import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingComplaintBundleStore } from "./pending-complaint-bundle-store.js";
import { newPendingComplaintBundle } from "./pending-complaint-bundle.js";

test("MemoryPendingComplaintBundleStore finds what it saved", () => {
  const store = newMemoryPendingComplaintBundleStore();
  const item = newPendingComplaintBundle("code-555", "name-467");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
