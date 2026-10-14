import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingReputationSegment } from "./pending-reputation-segment.js";

test("PendingReputationSegment starts in created", () => {
  const item = newPendingReputationSegment("code-839", "title-611");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingReputationSegment moves to published", () => {
  const item = newPendingReputationSegment("code-839", "title-611");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingReputationSegment rejects moves from retired", () => {
  const item = newPendingReputationSegment("code-839", "title-611");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
