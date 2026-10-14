import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionEntryStore } from "./conversion-entry-store.js";
import { newConversionEntry } from "./conversion-entry.js";

test("MemoryConversionEntryStore finds what it saved", () => {
  const store = newMemoryConversionEntryStore();
  const item = newConversionEntry("code-120", "title-786");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
