import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

test("ScheduledFunnelManifest starts in new", () => {
  const item = newScheduledFunnelManifest("code-247", "name-139");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFunnelManifest moves to done", () => {
  const item = newScheduledFunnelManifest("code-247", "name-139");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ScheduledFunnelManifest rejects moves from failed", () => {
  const item = newScheduledFunnelManifest("code-247", "name-139");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
