import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupLedger } from "./warmup-ledger.js";

test("WarmupLedger starts in proposed", () => {
  const item = newWarmupLedger("code-927", "name-610");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupLedger moves to approved", () => {
  const item = newWarmupLedger("code-927", "name-610");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WarmupLedger rejects moves from withdrawn", () => {
  const item = newWarmupLedger("code-927", "name-610");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
