import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientDeflectionBundleStore } from "./lenient-deflection-bundle-store.js";
import { newLenientDeflectionBundle } from "./lenient-deflection-bundle.js";

test("MemoryLenientDeflectionBundleStore finds what it saved", () => {
  const store = newMemoryLenientDeflectionBundleStore();
  const item = newLenientDeflectionBundle("code-247", "name-574");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
