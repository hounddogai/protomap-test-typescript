import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPacingAgreement } from "./legacy-pacing-agreement.js";

test("LegacyPacingAgreement starts in idle", () => {
  const item = newLegacyPacingAgreement("code-88", "title-317");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPacingAgreement moves to warming", () => {
  const item = newLegacyPacingAgreement("code-88", "title-317");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyPacingAgreement rejects moves from stopped", () => {
  const item = newLegacyPacingAgreement("code-88", "title-317");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
