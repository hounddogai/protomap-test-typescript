import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalQueuePreferenceStore } from "./regional-queue-preference-store.js";
import { newRegionalQueuePreference } from "./regional-queue-preference.js";

test("MemoryRegionalQueuePreferenceStore finds what it saved", () => {
  const store = newMemoryRegionalQueuePreferenceStore();
  const item = newRegionalQueuePreference("code-844", "name-614");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
