import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionSegment } from "./retention-segment.js";

test("RetentionSegment starts in requested", () => {
  const item = newRetentionSegment("code-92", "name-532");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionSegment moves to granted", () => {
  const item = newRetentionSegment("code-92", "name-532");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RetentionSegment rejects moves from expired", () => {
  const item = newRetentionSegment("code-92", "name-532");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
