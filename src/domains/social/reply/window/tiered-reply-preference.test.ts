import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredReplyPreference } from "./tiered-reply-preference.js";

test("TieredReplyPreference starts in planned", () => {
  const item = newTieredReplyPreference("code-910", "name-453");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredReplyPreference moves to scheduled", () => {
  const item = newTieredReplyPreference("code-910", "name-453");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredReplyPreference rejects moves from cancelled", () => {
  const item = newTieredReplyPreference("code-910", "name-453");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
