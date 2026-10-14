import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationNotice } from "./escalation-notice.js";

test("EscalationNotice starts in proposed", () => {
  const item = newEscalationNotice("code-556", "title-867");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationNotice moves to withdrawn", () => {
  const item = newEscalationNotice("code-556", "title-867");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("EscalationNotice rejects moves from withdrawn", () => {
  const item = newEscalationNotice("code-556", "title-867");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
