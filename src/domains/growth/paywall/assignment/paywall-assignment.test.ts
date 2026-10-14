import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallAssignment } from "./paywall-assignment.js";

test("PaywallAssignment starts in created", () => {
  const item = newPaywallAssignment("code-543", "title-951");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallAssignment moves to published", () => {
  const item = newPaywallAssignment("code-543", "title-951");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PaywallAssignment rejects moves from retired", () => {
  const item = newPaywallAssignment("code-543", "title-951");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
