import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledLevelProfileStore } from "./scheduled-level-profile-store.js";
import { newScheduledLevelProfile } from "./scheduled-level-profile.js";

test("MemoryScheduledLevelProfileStore finds what it saved", () => {
  const store = newMemoryScheduledLevelProfileStore();
  const item = newScheduledLevelProfile("code-467", "label-831");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
