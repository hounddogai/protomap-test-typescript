import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackInviteBaselineStore } from "./fallback-invite-baseline-store.js";
import { newFallbackInviteBaseline } from "./fallback-invite-baseline.js";

test("MemoryFallbackInviteBaselineStore finds what it saved", () => {
  const store = newMemoryFallbackInviteBaselineStore();
  const item = newFallbackInviteBaseline("code-82", "name-67");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
