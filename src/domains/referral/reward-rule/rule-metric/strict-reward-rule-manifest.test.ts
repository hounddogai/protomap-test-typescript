import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRewardRuleManifest } from "./strict-reward-rule-manifest.js";

test("StrictRewardRuleManifest starts in idle", () => {
  const item = newStrictRewardRuleManifest("code-950", "label-223");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRewardRuleManifest moves to ready", () => {
  const item = newStrictRewardRuleManifest("code-950", "label-223");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("StrictRewardRuleManifest rejects moves from stopped", () => {
  const item = newStrictRewardRuleManifest("code-950", "label-223");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
