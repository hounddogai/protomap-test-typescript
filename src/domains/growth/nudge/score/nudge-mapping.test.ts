import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeMapping } from "./nudge-mapping.js";

test("NudgeMapping starts in proposed", () => {
  const item = newNudgeMapping("code-70", "name-313");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeMapping moves to rejected", () => {
  const item = newNudgeMapping("code-70", "name-313");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("NudgeMapping rejects moves from withdrawn", () => {
  const item = newNudgeMapping("code-70", "name-313");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
