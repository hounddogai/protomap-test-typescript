import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeNotice } from "./nudge-notice.js";

test("NudgeNotice starts in open", () => {
  const item = newNudgeNotice("code-611", "title-993");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeNotice moves to in review", () => {
  const item = newNudgeNotice("code-611", "title-993");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("NudgeNotice rejects moves from archived", () => {
  const item = newNudgeNotice("code-611", "title-993");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
