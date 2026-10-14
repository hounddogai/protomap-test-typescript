import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFrequencyProfileStore } from "./scheduled-frequency-profile-store.js";
import { newScheduledFrequencyProfile } from "./scheduled-frequency-profile.js";

test("MemoryScheduledFrequencyProfileStore finds what it saved", () => {
  const store = newMemoryScheduledFrequencyProfileStore();
  const item = newScheduledFrequencyProfile("code-870", "title-753");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
