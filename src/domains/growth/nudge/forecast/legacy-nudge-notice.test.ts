import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyNudgeNotice } from "./legacy-nudge-notice.js";

test("LegacyNudgeNotice starts in created", () => {
  const item = newLegacyNudgeNotice("code-597", "label-251");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyNudgeNotice moves to retired", () => {
  const item = newLegacyNudgeNotice("code-597", "label-251");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LegacyNudgeNotice rejects moves from retired", () => {
  const item = newLegacyNudgeNotice("code-597", "label-251");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
