import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepEntryStore } from "./step-entry-store.js";
import { newStepEntry } from "./step-entry.js";

test("MemoryStepEntryStore finds what it saved", () => {
  const store = newMemoryStepEntryStore();
  const item = newStepEntry("code-469", "name-119");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
