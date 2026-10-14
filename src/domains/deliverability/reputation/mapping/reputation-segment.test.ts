import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationSegment } from "./reputation-segment.js";

test("ReputationSegment starts in new", () => {
  const item = newReputationSegment("code-418", "title-913");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationSegment moves to queued", () => {
  const item = newReputationSegment("code-418", "title-913");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ReputationSegment rejects moves from failed", () => {
  const item = newReputationSegment("code-418", "title-913");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
