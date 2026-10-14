import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionDigestStore } from "./deflection-digest-store.js";
import { newDeflectionDigest } from "./deflection-digest.js";

test("MemoryDeflectionDigestStore finds what it saved", () => {
  const store = newMemoryDeflectionDigestStore();
  const item = newDeflectionDigest("code-648", "title-900");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
