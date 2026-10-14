import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionAgreement } from "./mention-agreement.js";

test("MentionAgreement starts in created", () => {
  const item = newMentionAgreement("code-555", "label-345");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionAgreement moves to published", () => {
  const item = newMentionAgreement("code-555", "label-345");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("MentionAgreement rejects moves from retired", () => {
  const item = newMentionAgreement("code-555", "label-345");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
