import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualDoubleOptInEntryStore } from "./manual-double-opt-in-entry-store.js";
import { newManualDoubleOptInEntry } from "./manual-double-opt-in-entry.js";

test("MemoryManualDoubleOptInEntryStore finds what it saved", () => {
  const store = newMemoryManualDoubleOptInEntryStore();
  const item = newManualDoubleOptInEntry("code-100", "title-871");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
