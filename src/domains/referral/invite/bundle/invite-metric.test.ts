import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteMetric } from "./invite-metric.js";

test("InviteMetric starts in proposed", () => {
  const item = newInviteMetric("code-683", "label-408");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteMetric moves to rejected", () => {
  const item = newInviteMetric("code-683", "label-408");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("InviteMetric rejects moves from withdrawn", () => {
  const item = newInviteMetric("code-683", "label-408");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
