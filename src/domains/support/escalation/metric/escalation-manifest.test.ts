import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationManifest } from "./escalation-manifest.js";

test("EscalationManifest starts in planned", () => {
  const item = newEscalationManifest("code-340", "name-735");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationManifest moves to scheduled", () => {
  const item = newEscalationManifest("code-340", "name-735");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("EscalationManifest rejects moves from cancelled", () => {
  const item = newEscalationManifest("code-340", "name-735");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
