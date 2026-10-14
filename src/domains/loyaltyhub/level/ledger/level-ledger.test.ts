import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelLedger } from "./level-ledger.js";

test("LevelLedger starts in open", () => {
  const item = newLevelLedger("code-402", "name-256");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelLedger moves to resolved", () => {
  const item = newLevelLedger("code-402", "name-256");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LevelLedger rejects moves from archived", () => {
  const item = newLevelLedger("code-402", "name-256");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
