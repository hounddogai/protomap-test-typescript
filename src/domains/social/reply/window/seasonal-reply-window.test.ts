import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalReplyWindow } from "./seasonal-reply-window.js";

test("SeasonalReplyWindow starts in idle", () => {
  const item = newSeasonalReplyWindow("code-996", "label-833");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalReplyWindow moves to stopped", () => {
  const item = newSeasonalReplyWindow("code-996", "label-833");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("SeasonalReplyWindow rejects moves from stopped", () => {
  const item = newSeasonalReplyWindow("code-996", "label-833");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
