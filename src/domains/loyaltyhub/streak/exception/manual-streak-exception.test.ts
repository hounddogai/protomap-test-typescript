import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualStreakException } from "./manual-streak-exception.js";

test("ManualStreakException starts in open", () => {
  const item = newManualStreakException("code-428", "name-397");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualStreakException moves to reopened", () => {
  const item = newManualStreakException("code-428", "name-397");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ManualStreakException rejects moves from archived", () => {
  const item = newManualStreakException("code-428", "name-397");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
