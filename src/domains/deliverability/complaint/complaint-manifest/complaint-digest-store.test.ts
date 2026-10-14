import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintDigestStore } from "./complaint-digest-store.js";
import { newComplaintDigest } from "./complaint-digest.js";

test("MemoryComplaintDigestStore finds what it saved", () => {
  const store = newMemoryComplaintDigestStore();
  const item = newComplaintDigest("code-615", "title-101");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
