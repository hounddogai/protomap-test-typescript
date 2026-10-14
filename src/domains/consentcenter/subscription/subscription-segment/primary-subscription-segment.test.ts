import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySubscriptionSegment } from "./primary-subscription-segment.js";

test("PrimarySubscriptionSegment starts in requested", () => {
  const item = newPrimarySubscriptionSegment("code-447", "title-201");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySubscriptionSegment moves to granted", () => {
  const item = newPrimarySubscriptionSegment("code-447", "title-201");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimarySubscriptionSegment rejects moves from expired", () => {
  const item = newPrimarySubscriptionSegment("code-447", "title-201");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
