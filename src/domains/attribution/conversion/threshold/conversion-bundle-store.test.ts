import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionBundleStore } from "./conversion-bundle-store.js";
import { newConversionBundle } from "./conversion-bundle.js";

test("MemoryConversionBundleStore finds what it saved", () => {
  const store = newMemoryConversionBundleStore();
  const item = newConversionBundle("code-436", "label-395");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
