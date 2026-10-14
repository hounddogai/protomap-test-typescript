import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaSegment } from "./sla-segment.js";

test("SlaSegment starts in planned", () => {
  const item = newSlaSegment("code-583", "title-688");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaSegment moves to cancelled", () => {
  const item = newSlaSegment("code-583", "title-688");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("SlaSegment rejects moves from cancelled", () => {
  const item = newSlaSegment("code-583", "title-688");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
