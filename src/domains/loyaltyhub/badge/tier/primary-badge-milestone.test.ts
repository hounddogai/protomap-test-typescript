import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBadgeMilestone } from "./primary-badge-milestone.js";

test("PrimaryBadgeMilestone starts in requested", () => {
  const item = newPrimaryBadgeMilestone("code-733", "name-133");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBadgeMilestone moves to granted", () => {
  const item = newPrimaryBadgeMilestone("code-733", "name-133");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryBadgeMilestone rejects moves from expired", () => {
  const item = newPrimaryBadgeMilestone("code-733", "name-133");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
