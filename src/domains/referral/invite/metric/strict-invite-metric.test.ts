import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictInviteMetric } from "./strict-invite-metric.js";

test("StrictInviteMetric starts in draft", () => {
  const item = newStrictInviteMetric("code-466", "name-267");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictInviteMetric moves to pending", () => {
  const item = newStrictInviteMetric("code-466", "name-267");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StrictInviteMetric rejects moves from closed", () => {
  const item = newStrictInviteMetric("code-466", "name-267");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
