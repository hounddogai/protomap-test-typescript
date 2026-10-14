import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictBranchManifestStore } from "./strict-branch-manifest-store.js";
import { newStrictBranchManifest } from "./strict-branch-manifest.js";

test("MemoryStrictBranchManifestStore finds what it saved", () => {
  const store = newMemoryStrictBranchManifestStore();
  const item = newStrictBranchManifest("code-418", "name-819");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
