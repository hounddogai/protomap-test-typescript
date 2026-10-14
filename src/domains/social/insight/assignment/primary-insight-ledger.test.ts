import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryInsightLedger } from "./primary-insight-ledger.js";

test("PrimaryInsightLedger starts in idle", () => {
  const item = newPrimaryInsightLedger("code-448", "name-551");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryInsightLedger moves to ready", () => {
  const item = newPrimaryInsightLedger("code-448", "name-551");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PrimaryInsightLedger rejects moves from stopped", () => {
  const item = newPrimaryInsightLedger("code-448", "name-551");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
