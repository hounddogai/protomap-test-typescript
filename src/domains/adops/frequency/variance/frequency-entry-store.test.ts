import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyEntryStore } from "./frequency-entry-store.js";
import { newFrequencyEntry } from "./frequency-entry.js";

test("MemoryFrequencyEntryStore finds what it saved", () => {
  const store = newMemoryFrequencyEntryStore();
  const item = newFrequencyEntry("code-426", "label-314");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
