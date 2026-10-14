import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingNudgeMapping } from "./rolling-nudge-mapping.js";

test("RollingNudgeMapping starts in proposed", () => {
  const item = newRollingNudgeMapping("code-515", "title-883");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingNudgeMapping moves to approved", () => {
  const item = newRollingNudgeMapping("code-515", "title-883");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RollingNudgeMapping rejects moves from withdrawn", () => {
  const item = newRollingNudgeMapping("code-515", "title-883");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
