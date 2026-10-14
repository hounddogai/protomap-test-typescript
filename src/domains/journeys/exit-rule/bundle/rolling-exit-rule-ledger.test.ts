import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

test("RollingExitRuleLedger starts in open", () => {
  const item = newRollingExitRuleLedger("code-831", "name-599");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingExitRuleLedger moves to reopened", () => {
  const item = newRollingExitRuleLedger("code-831", "name-599");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RollingExitRuleLedger rejects moves from archived", () => {
  const item = newRollingExitRuleLedger("code-831", "name-599");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
