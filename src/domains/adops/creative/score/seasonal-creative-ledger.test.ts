import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

test("SeasonalCreativeLedger starts in idle", () => {
  const item = newSeasonalCreativeLedger("code-727", "label-471");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCreativeLedger moves to warming", () => {
  const item = newSeasonalCreativeLedger("code-727", "label-471");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalCreativeLedger rejects moves from stopped", () => {
  const item = newSeasonalCreativeLedger("code-727", "label-471");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
