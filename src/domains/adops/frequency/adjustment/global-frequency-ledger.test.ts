import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFrequencyLedger } from "./global-frequency-ledger.js";

test("GlobalFrequencyLedger starts in open", () => {
  const item = newGlobalFrequencyLedger("code-751", "title-205");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFrequencyLedger moves to resolved", () => {
  const item = newGlobalFrequencyLedger("code-751", "title-205");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("GlobalFrequencyLedger rejects moves from archived", () => {
  const item = newGlobalFrequencyLedger("code-751", "title-205");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
