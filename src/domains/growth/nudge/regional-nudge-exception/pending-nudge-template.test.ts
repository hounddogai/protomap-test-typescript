import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingNudgeTemplate } from "./pending-nudge-template.js";

test("PendingNudgeTemplate starts in proposed", () => {
  const item = newPendingNudgeTemplate("code-320", "title-974");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingNudgeTemplate moves to withdrawn", () => {
  const item = newPendingNudgeTemplate("code-320", "title-974");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PendingNudgeTemplate rejects moves from withdrawn", () => {
  const item = newPendingNudgeTemplate("code-320", "title-974");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
