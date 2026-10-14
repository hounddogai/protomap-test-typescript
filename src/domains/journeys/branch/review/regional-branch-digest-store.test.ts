import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalBranchDigestStore } from "./regional-branch-digest-store.js";
import { newRegionalBranchDigest } from "./regional-branch-digest.js";

test("MemoryRegionalBranchDigestStore finds what it saved", () => {
  const store = newMemoryRegionalBranchDigestStore();
  const item = newRegionalBranchDigest("code-61", "title-429");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
