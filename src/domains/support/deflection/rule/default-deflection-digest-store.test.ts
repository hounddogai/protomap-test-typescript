import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultDeflectionDigestStore } from "./default-deflection-digest-store.js";
import { newDefaultDeflectionDigest } from "./default-deflection-digest.js";

test("MemoryDefaultDeflectionDigestStore finds what it saved", () => {
  const store = newMemoryDefaultDeflectionDigestStore();
  const item = newDefaultDeflectionDigest("code-718", "name-799");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
