import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyLevelNotice } from "./legacy-level-notice.js";

test("LegacyLevelNotice starts in idle", () => {
  const item = newLegacyLevelNotice("code-861", "title-321");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyLevelNotice moves to ready", () => {
  const item = newLegacyLevelNotice("code-861", "title-321");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LegacyLevelNotice rejects moves from stopped", () => {
  const item = newLegacyLevelNotice("code-861", "title-321");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
