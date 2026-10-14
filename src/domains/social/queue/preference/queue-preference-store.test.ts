import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueuePreferenceStore } from "./queue-preference-store.js";
import { newQueuePreference } from "./queue-preference.js";

test("MemoryQueuePreferenceStore finds what it saved", () => {
  const store = newMemoryQueuePreferenceStore();
  const item = newQueuePreference("code-854", "label-600");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
