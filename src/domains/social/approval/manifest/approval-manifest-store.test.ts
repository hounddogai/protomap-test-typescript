import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalManifestStore } from "./approval-manifest-store.js";
import { newApprovalManifest } from "./approval-manifest.js";

test("MemoryApprovalManifestStore finds what it saved", () => {
  const store = newMemoryApprovalManifestStore();
  const item = newApprovalManifest("code-40", "name-661");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
