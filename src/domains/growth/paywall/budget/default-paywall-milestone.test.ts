import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPaywallMilestone } from "./default-paywall-milestone.js";

test("DefaultPaywallMilestone starts in created", () => {
  const item = newDefaultPaywallMilestone("code-634", "name-239");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPaywallMilestone moves to published", () => {
  const item = newDefaultPaywallMilestone("code-634", "name-239");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("DefaultPaywallMilestone rejects moves from retired", () => {
  const item = newDefaultPaywallMilestone("code-634", "name-239");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
