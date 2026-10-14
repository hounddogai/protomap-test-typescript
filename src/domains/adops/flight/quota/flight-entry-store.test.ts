import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightEntryStore } from "./flight-entry-store.js";
import { newFlightEntry } from "./flight-entry.js";

test("MemoryFlightEntryStore finds what it saved", () => {
  const store = newMemoryFlightEntryStore();
  const item = newFlightEntry("code-257", "label-181");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
