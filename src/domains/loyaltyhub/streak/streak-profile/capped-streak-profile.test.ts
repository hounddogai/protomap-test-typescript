import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStreakProfile } from "./capped-streak-profile.js";

test("CappedStreakProfile starts in open", () => {
  const item = newCappedStreakProfile("code-911", "label-151");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStreakProfile moves to resolved", () => {
  const item = newCappedStreakProfile("code-911", "label-151");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CappedStreakProfile rejects moves from archived", () => {
  const item = newCappedStreakProfile("code-911", "label-151");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
