import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledNudgeProfileStore } from "./scheduled-nudge-profile-store.js";
import { newScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

test("MemoryScheduledNudgeProfileStore finds what it saved", () => {
  const store = newMemoryScheduledNudgeProfileStore();
  const item = newScheduledNudgeProfile("code-978", "label-840");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
