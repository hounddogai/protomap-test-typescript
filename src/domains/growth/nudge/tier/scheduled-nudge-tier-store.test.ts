import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledNudgeTierStore } from "./scheduled-nudge-tier-store.js";
import { newScheduledNudgeTier } from "./scheduled-nudge-tier.js";

test("MemoryScheduledNudgeTierStore finds what it saved", () => {
  const store = newMemoryScheduledNudgeTierStore();
  const item = newScheduledNudgeTier("code-814", "title-364");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
