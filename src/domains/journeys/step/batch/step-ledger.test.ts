import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepLedger } from "./step-ledger.js";

test("StepLedger starts in draft", () => {
  const item = newStepLedger("code-691", "name-246");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepLedger moves to closed", () => {
  const item = newStepLedger("code-691", "name-246");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("StepLedger rejects moves from closed", () => {
  const item = newStepLedger("code-691", "name-246");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
