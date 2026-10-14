import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalReplySchedule } from "./regional-reply-schedule.js";

test("RegionalReplySchedule starts in open", () => {
  const item = newRegionalReplySchedule("code-724", "title-153");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalReplySchedule moves to reopened", () => {
  const item = newRegionalReplySchedule("code-724", "title-153");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RegionalReplySchedule rejects moves from archived", () => {
  const item = newRegionalReplySchedule("code-724", "title-153");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
