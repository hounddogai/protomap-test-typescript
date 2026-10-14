import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyAssignment } from "./reply-assignment.js";

test("ReplyAssignment starts in created", () => {
  const item = newReplyAssignment("code-221", "name-923");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyAssignment moves to validated", () => {
  const item = newReplyAssignment("code-221", "name-923");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ReplyAssignment rejects moves from retired", () => {
  const item = newReplyAssignment("code-221", "name-923");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
