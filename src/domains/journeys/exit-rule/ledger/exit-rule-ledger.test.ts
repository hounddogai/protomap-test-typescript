import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleLedger } from "./exit-rule-ledger.js";

test("ExitRuleLedger starts in idle", () => {
  const item = newExitRuleLedger("code-809", "title-918");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleLedger moves to draining", () => {
  const item = newExitRuleLedger("code-809", "title-918");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("ExitRuleLedger rejects moves from stopped", () => {
  const item = newExitRuleLedger("code-809", "title-918");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
