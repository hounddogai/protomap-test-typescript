import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalInviteRequest } from "./regional-invite-request.js";

test("RegionalInviteRequest starts in open", () => {
  const item = newRegionalInviteRequest("code-218", "label-798");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalInviteRequest moves to resolved", () => {
  const item = newRegionalInviteRequest("code-218", "label-798");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalInviteRequest rejects moves from archived", () => {
  const item = newRegionalInviteRequest("code-218", "label-798");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
