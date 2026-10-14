import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedNudgeMapping } from "./capped-nudge-mapping.js";

test("CappedNudgeMapping starts in proposed", () => {
  const item = newCappedNudgeMapping("code-694", "label-980");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedNudgeMapping moves to approved", () => {
  const item = newCappedNudgeMapping("code-694", "label-980");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedNudgeMapping rejects moves from withdrawn", () => {
  const item = newCappedNudgeMapping("code-694", "label-980");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
