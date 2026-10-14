import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalEscalationManifest } from "./global-escalation-manifest.js";

test("GlobalEscalationManifest starts in new", () => {
  const item = newGlobalEscalationManifest("code-410", "label-333");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalEscalationManifest moves to running", () => {
  const item = newGlobalEscalationManifest("code-410", "label-333");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("GlobalEscalationManifest rejects moves from failed", () => {
  const item = newGlobalEscalationManifest("code-410", "label-333");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
