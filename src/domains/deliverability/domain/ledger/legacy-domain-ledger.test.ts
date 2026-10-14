import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDomainLedger } from "./legacy-domain-ledger.js";

test("LegacyDomainLedger starts in idle", () => {
  const item = newLegacyDomainLedger("code-623", "label-137");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDomainLedger moves to ready", () => {
  const item = newLegacyDomainLedger("code-623", "label-137");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LegacyDomainLedger rejects moves from stopped", () => {
  const item = newLegacyDomainLedger("code-623", "label-137");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
