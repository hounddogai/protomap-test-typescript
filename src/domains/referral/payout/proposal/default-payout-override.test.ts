import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPayoutOverride } from "./default-payout-override.js";

test("DefaultPayoutOverride starts in draft", () => {
  const item = newDefaultPayoutOverride("code-927", "title-195");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPayoutOverride moves to active", () => {
  const item = newDefaultPayoutOverride("code-927", "title-195");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("DefaultPayoutOverride rejects moves from closed", () => {
  const item = newDefaultPayoutOverride("code-927", "title-195");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
