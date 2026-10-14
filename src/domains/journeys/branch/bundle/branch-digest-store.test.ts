import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchDigestStore } from "./branch-digest-store.js";
import { newBranchDigest } from "./branch-digest.js";

test("MemoryBranchDigestStore finds what it saved", () => {
  const store = newMemoryBranchDigestStore();
  const item = newBranchDigest("code-924", "label-582");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
