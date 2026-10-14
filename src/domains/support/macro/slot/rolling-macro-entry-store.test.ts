import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingMacroEntryStore } from "./rolling-macro-entry-store.js";
import { newRollingMacroEntry } from "./rolling-macro-entry.js";

test("MemoryRollingMacroEntryStore finds what it saved", () => {
  const store = newMemoryRollingMacroEntryStore();
  const item = newRollingMacroEntry("code-426", "label-973");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
