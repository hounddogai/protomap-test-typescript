import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStreakPolicy } from "./capped-streak-policy.js";

test("CappedStreakPolicy starts in open", () => {
  const item = newCappedStreakPolicy("code-14", "label-245");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStreakPolicy moves to archived", () => {
  const item = newCappedStreakPolicy("code-14", "label-245");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("CappedStreakPolicy rejects moves from archived", () => {
  const item = newCappedStreakPolicy("code-14", "label-245");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
