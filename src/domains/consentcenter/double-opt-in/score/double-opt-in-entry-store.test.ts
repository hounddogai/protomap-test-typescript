import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInEntryStore } from "./double-opt-in-entry-store.js";
import { newDoubleOptInEntry } from "./double-opt-in-entry.js";

test("MemoryDoubleOptInEntryStore finds what it saved", () => {
  const store = newMemoryDoubleOptInEntryStore();
  const item = newDoubleOptInEntry("code-506", "name-93");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
