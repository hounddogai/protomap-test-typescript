import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultEscalationManifest } from "./default-escalation-manifest.js";

test("DefaultEscalationManifest starts in planned", () => {
  const item = newDefaultEscalationManifest("code-88", "label-286");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultEscalationManifest moves to completed", () => {
  const item = newDefaultEscalationManifest("code-88", "label-286");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("DefaultEscalationManifest rejects moves from cancelled", () => {
  const item = newDefaultEscalationManifest("code-88", "label-286");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
