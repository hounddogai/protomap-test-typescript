import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictDeflectionOverrideStore } from "./strict-deflection-override-store.js";
import { newStrictDeflectionOverride } from "./strict-deflection-override.js";

test("MemoryStrictDeflectionOverrideStore finds what it saved", () => {
  const store = newMemoryStrictDeflectionOverrideStore();
  const item = newStrictDeflectionOverride("code-322", "title-811");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
