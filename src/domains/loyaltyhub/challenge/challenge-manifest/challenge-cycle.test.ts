import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeCycle } from "./challenge-cycle.js";

test("ChallengeCycle starts in open", () => {
  const item = newChallengeCycle("code-110", "name-433");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeCycle moves to resolved", () => {
  const item = newChallengeCycle("code-110", "name-433");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ChallengeCycle rejects moves from archived", () => {
  const item = newChallengeCycle("code-110", "name-433");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
