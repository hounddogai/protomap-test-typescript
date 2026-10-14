import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteSchedule } from "./invite-schedule.js";

test("InviteSchedule starts in open", () => {
  const item = newInviteSchedule("code-176", "title-428");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteSchedule moves to archived", () => {
  const item = newInviteSchedule("code-176", "title-428");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("InviteSchedule rejects moves from archived", () => {
  const item = newInviteSchedule("code-176", "title-428");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
