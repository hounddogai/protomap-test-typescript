import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTierSegment } from "./primary-tier-segment.js";

test("PrimaryTierSegment starts in draft", () => {
  const item = newPrimaryTierSegment("code-402", "name-757");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTierSegment moves to pending", () => {
  const item = newPrimaryTierSegment("code-402", "name-757");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryTierSegment rejects moves from closed", () => {
  const item = newPrimaryTierSegment("code-402", "name-757");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
