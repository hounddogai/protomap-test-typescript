import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultNudgeTierStore } from "./default-nudge-tier-store.js";
import { newDefaultNudgeTier } from "./default-nudge-tier.js";

test("MemoryDefaultNudgeTierStore finds what it saved", () => {
  const store = newMemoryDefaultNudgeTierStore();
  const item = newDefaultNudgeTier("code-733", "label-425");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
