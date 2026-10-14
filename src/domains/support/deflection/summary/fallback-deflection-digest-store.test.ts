import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackDeflectionDigestStore } from "./fallback-deflection-digest-store.js";
import { newFallbackDeflectionDigest } from "./fallback-deflection-digest.js";

test("MemoryFallbackDeflectionDigestStore finds what it saved", () => {
  const store = newMemoryFallbackDeflectionDigestStore();
  const item = newFallbackDeflectionDigest("code-584", "name-473");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
