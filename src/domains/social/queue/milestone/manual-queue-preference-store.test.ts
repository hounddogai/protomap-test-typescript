import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualQueuePreferenceStore } from "./manual-queue-preference-store.js";
import { newManualQueuePreference } from "./manual-queue-preference.js";

test("MemoryManualQueuePreferenceStore finds what it saved", () => {
  const store = newMemoryManualQueuePreferenceStore();
  const item = newManualQueuePreference("code-188", "label-715");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
