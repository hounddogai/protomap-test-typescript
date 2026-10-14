import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedFrequencyEntryStore } from "./capped-frequency-entry-store.js";
import { newCappedFrequencyEntry } from "./capped-frequency-entry.js";

test("MemoryCappedFrequencyEntryStore finds what it saved", () => {
  const store = newMemoryCappedFrequencyEntryStore();
  const item = newCappedFrequencyEntry("code-249", "name-520");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
