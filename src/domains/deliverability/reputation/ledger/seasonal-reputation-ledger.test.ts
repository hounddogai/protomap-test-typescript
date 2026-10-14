import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalReputationLedger } from "./seasonal-reputation-ledger.js";

test("SeasonalReputationLedger starts in open", () => {
  const item = newSeasonalReputationLedger("code-675", "label-598");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalReputationLedger moves to reopened", () => {
  const item = newSeasonalReputationLedger("code-675", "label-598");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SeasonalReputationLedger rejects moves from archived", () => {
  const item = newSeasonalReputationLedger("code-675", "label-598");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
