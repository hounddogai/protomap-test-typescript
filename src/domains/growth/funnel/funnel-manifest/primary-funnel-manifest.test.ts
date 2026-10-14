import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFunnelManifest } from "./primary-funnel-manifest.js";

test("PrimaryFunnelManifest starts in created", () => {
  const item = newPrimaryFunnelManifest("code-62", "label-148");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFunnelManifest moves to retired", () => {
  const item = newPrimaryFunnelManifest("code-62", "label-148");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PrimaryFunnelManifest rejects moves from retired", () => {
  const item = newPrimaryFunnelManifest("code-62", "label-148");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
