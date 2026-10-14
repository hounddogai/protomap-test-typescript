import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCreativeSegment } from "./legacy-creative-segment.js";

test("LegacyCreativeSegment starts in created", () => {
  const item = newLegacyCreativeSegment("code-84", "title-627");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCreativeSegment moves to retired", () => {
  const item = newLegacyCreativeSegment("code-84", "title-627");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LegacyCreativeSegment rejects moves from retired", () => {
  const item = newLegacyCreativeSegment("code-84", "title-627");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
