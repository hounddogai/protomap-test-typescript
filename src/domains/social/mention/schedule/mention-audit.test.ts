import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionAudit } from "./mention-audit.js";

test("MentionAudit starts in open", () => {
  const item = newMentionAudit("code-188", "label-939");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionAudit moves to reopened", () => {
  const item = newMentionAudit("code-188", "label-939");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("MentionAudit rejects moves from archived", () => {
  const item = newMentionAudit("code-188", "label-939");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
