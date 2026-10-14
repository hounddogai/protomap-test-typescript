import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepDigestStore } from "./step-digest-store.js";
import { newStepDigest } from "./step-digest.js";

test("MemoryStepDigestStore finds what it saved", () => {
  const store = newMemoryStepDigestStore();
  const item = newStepDigest("code-363", "label-824");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
