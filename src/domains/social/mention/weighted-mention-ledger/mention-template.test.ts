import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionTemplate } from "./mention-template.js";

test("MentionTemplate starts in open", () => {
  const item = newMentionTemplate("code-254", "name-925");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionTemplate moves to reopened", () => {
  const item = newMentionTemplate("code-254", "name-925");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("MentionTemplate rejects moves from archived", () => {
  const item = newMentionTemplate("code-254", "name-925");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
