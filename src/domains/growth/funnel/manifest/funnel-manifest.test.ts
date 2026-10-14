import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelManifest } from "./funnel-manifest.js";

test("FunnelManifest starts in planned", () => {
  const item = newFunnelManifest("code-399", "label-262");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelManifest moves to completed", () => {
  const item = newFunnelManifest("code-399", "label-262");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("FunnelManifest rejects moves from cancelled", () => {
  const item = newFunnelManifest("code-399", "label-262");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
