import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeTierStore } from "./nudge-tier-store.js";
import { newNudgeTier } from "./nudge-tier.js";

test("MemoryNudgeTierStore finds what it saved", () => {
  const store = newMemoryNudgeTierStore();
  const item = newNudgeTier("code-75", "name-307");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
