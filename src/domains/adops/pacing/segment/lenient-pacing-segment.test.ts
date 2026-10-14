import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPacingSegment } from "./lenient-pacing-segment.js";

test("LenientPacingSegment starts in proposed", () => {
  const item = newLenientPacingSegment("code-216", "title-329");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPacingSegment moves to approved", () => {
  const item = newLenientPacingSegment("code-216", "title-329");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientPacingSegment rejects moves from withdrawn", () => {
  const item = newLenientPacingSegment("code-216", "title-329");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
