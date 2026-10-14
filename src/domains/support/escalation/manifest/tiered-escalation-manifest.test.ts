import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredEscalationManifest } from "./tiered-escalation-manifest.js";

test("TieredEscalationManifest starts in draft", () => {
  const item = newTieredEscalationManifest("code-966", "label-140");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredEscalationManifest moves to active", () => {
  const item = newTieredEscalationManifest("code-966", "label-140");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TieredEscalationManifest rejects moves from closed", () => {
  const item = newTieredEscalationManifest("code-966", "label-140");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
