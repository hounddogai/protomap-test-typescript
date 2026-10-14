import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBadgeMilestone } from "./scheduled-badge-milestone.js";

test("ScheduledBadgeMilestone starts in requested", () => {
  const item = newScheduledBadgeMilestone("code-518", "name-267");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBadgeMilestone moves to granted", () => {
  const item = newScheduledBadgeMilestone("code-518", "name-267");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledBadgeMilestone rejects moves from expired", () => {
  const item = newScheduledBadgeMilestone("code-518", "name-267");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
