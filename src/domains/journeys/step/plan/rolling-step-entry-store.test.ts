import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingStepEntryStore } from "./rolling-step-entry-store.js";
import { newRollingStepEntry } from "./rolling-step-entry.js";

test("MemoryRollingStepEntryStore finds what it saved", () => {
  const store = newMemoryRollingStepEntryStore();
  const item = newRollingStepEntry("code-526", "title-135");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
