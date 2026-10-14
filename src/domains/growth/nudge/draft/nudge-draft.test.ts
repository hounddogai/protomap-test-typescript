import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeDraft } from "./nudge-draft.js";

test("NudgeDraft starts in open", () => {
  const item = newNudgeDraft("code-676", "title-382");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeDraft moves to resolved", () => {
  const item = newNudgeDraft("code-676", "title-382");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("NudgeDraft rejects moves from archived", () => {
  const item = newNudgeDraft("code-676", "title-382");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
