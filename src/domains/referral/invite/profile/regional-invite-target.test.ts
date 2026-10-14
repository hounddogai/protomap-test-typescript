import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalInviteTarget } from "./regional-invite-target.js";

test("RegionalInviteTarget starts in new", () => {
  const item = newRegionalInviteTarget("code-136", "label-781");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalInviteTarget moves to queued", () => {
  const item = newRegionalInviteTarget("code-136", "label-781");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RegionalInviteTarget rejects moves from failed", () => {
  const item = newRegionalInviteTarget("code-136", "label-781");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
