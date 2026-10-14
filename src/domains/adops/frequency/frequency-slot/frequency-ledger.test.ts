import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyLedger } from "./frequency-ledger.js";

test("FrequencyLedger starts in idle", () => {
  const item = newFrequencyLedger("code-630", "title-597");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyLedger moves to warming", () => {
  const item = newFrequencyLedger("code-630", "title-597");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FrequencyLedger rejects moves from stopped", () => {
  const item = newFrequencyLedger("code-630", "title-597");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
