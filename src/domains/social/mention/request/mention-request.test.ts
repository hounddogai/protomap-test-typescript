import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionRequest } from "./mention-request.js";

test("MentionRequest starts in proposed", () => {
  const item = newMentionRequest("code-153", "title-81");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionRequest moves to approved", () => {
  const item = newMentionRequest("code-153", "title-81");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("MentionRequest rejects moves from withdrawn", () => {
  const item = newMentionRequest("code-153", "title-81");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
