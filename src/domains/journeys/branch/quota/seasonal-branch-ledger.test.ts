import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBranchLedger } from "./seasonal-branch-ledger.js";

test("SeasonalBranchLedger starts in idle", () => {
  const item = newSeasonalBranchLedger("code-3", "name-293");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBranchLedger moves to warming", () => {
  const item = newSeasonalBranchLedger("code-3", "name-293");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalBranchLedger rejects moves from stopped", () => {
  const item = newSeasonalBranchLedger("code-3", "name-293");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
