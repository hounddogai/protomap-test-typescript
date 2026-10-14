import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionDigestStore } from "./suppression-digest-store.js";
import { newSuppressionDigest } from "./suppression-digest.js";

test("MemorySuppressionDigestStore finds what it saved", () => {
  const store = newMemorySuppressionDigestStore();
  const item = newSuppressionDigest("code-117", "label-171");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
