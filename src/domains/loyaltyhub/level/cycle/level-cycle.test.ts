import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelCycle } from "./level-cycle.js";

test("LevelCycle starts in requested", () => {
  const item = newLevelCycle("code-629", "name-347");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelCycle moves to expired", () => {
  const item = newLevelCycle("code-629", "name-347");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("LevelCycle rejects moves from expired", () => {
  const item = newLevelCycle("code-629", "name-347");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
