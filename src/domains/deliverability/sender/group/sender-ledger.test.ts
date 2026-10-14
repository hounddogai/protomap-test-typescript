import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderLedger } from "./sender-ledger.js";

test("SenderLedger starts in created", () => {
  const item = newSenderLedger("code-851", "label-478");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderLedger moves to retired", () => {
  const item = newSenderLedger("code-851", "label-478");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("SenderLedger rejects moves from retired", () => {
  const item = newSenderLedger("code-851", "label-478");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
