import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyProofCycle } from "./legacy-proof-cycle.js";

test("LegacyProofCycle starts in idle", () => {
  const item = newLegacyProofCycle("code-884", "label-653");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyProofCycle moves to warming", () => {
  const item = newLegacyProofCycle("code-884", "label-653");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyProofCycle rejects moves from stopped", () => {
  const item = newLegacyProofCycle("code-884", "label-653");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
