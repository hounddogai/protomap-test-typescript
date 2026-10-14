import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFlightEntryStore } from "./default-flight-entry-store.js";
import { newDefaultFlightEntry } from "./default-flight-entry.js";

test("MemoryDefaultFlightEntryStore finds what it saved", () => {
  const store = newMemoryDefaultFlightEntryStore();
  const item = newDefaultFlightEntry("code-776", "title-900");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
