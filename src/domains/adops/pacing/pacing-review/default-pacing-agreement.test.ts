import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPacingAgreement } from "./default-pacing-agreement.js";

test("DefaultPacingAgreement starts in idle", () => {
  const item = newDefaultPacingAgreement("code-26", "label-201");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPacingAgreement moves to stopped", () => {
  const item = newDefaultPacingAgreement("code-26", "label-201");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("DefaultPacingAgreement rejects moves from stopped", () => {
  const item = newDefaultPacingAgreement("code-26", "label-201");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
