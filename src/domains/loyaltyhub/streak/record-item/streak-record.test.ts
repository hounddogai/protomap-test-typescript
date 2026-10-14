import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakRecord } from "./streak-record.js";

test("StreakRecord starts in requested", () => {
  const item = newStreakRecord("code-350", "label-256");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakRecord moves to expired", () => {
  const item = newStreakRecord("code-350", "label-256");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("StreakRecord rejects moves from expired", () => {
  const item = newStreakRecord("code-350", "label-256");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
