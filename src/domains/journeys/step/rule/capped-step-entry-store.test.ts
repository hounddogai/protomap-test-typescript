import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedStepEntryStore } from "./capped-step-entry-store.js";
import { newCappedStepEntry } from "./capped-step-entry.js";

test("MemoryCappedStepEntryStore finds what it saved", () => {
  const store = newMemoryCappedStepEntryStore();
  const item = newCappedStepEntry("code-126", "label-792");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
