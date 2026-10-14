import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyOptOutSegment } from "./legacy-opt-out-segment.js";

test("LegacyOptOutSegment starts in created", () => {
  const item = newLegacyOptOutSegment("code-819", "label-345");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyOptOutSegment moves to retired", () => {
  const item = newLegacyOptOutSegment("code-819", "label-345");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LegacyOptOutSegment rejects moves from retired", () => {
  const item = newLegacyOptOutSegment("code-819", "label-345");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
