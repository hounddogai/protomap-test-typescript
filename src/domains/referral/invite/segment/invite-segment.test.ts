import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteSegment } from "./invite-segment.js";

test("InviteSegment starts in created", () => {
  const item = newInviteSegment("code-710", "title-986");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteSegment moves to published", () => {
  const item = newInviteSegment("code-710", "title-986");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("InviteSegment rejects moves from retired", () => {
  const item = newInviteSegment("code-710", "title-986");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
