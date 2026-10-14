import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientInviteSegment } from "./lenient-invite-segment.js";

test("LenientInviteSegment starts in requested", () => {
  const item = newLenientInviteSegment("code-675", "name-870");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientInviteSegment moves to granted", () => {
  const item = newLenientInviteSegment("code-675", "name-870");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LenientInviteSegment rejects moves from expired", () => {
  const item = newLenientInviteSegment("code-675", "name-870");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
