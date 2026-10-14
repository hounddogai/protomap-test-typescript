import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeSegment } from "./badge-segment.js";

test("BadgeSegment starts in created", () => {
  const item = newBadgeSegment("code-665", "name-229");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeSegment moves to validated", () => {
  const item = newBadgeSegment("code-665", "name-229");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BadgeSegment rejects moves from retired", () => {
  const item = newBadgeSegment("code-665", "name-229");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
