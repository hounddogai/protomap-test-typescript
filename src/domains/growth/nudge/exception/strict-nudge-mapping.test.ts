import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictNudgeMapping } from "./strict-nudge-mapping.js";

test("StrictNudgeMapping starts in open", () => {
  const item = newStrictNudgeMapping("code-193", "name-47");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictNudgeMapping moves to reopened", () => {
  const item = newStrictNudgeMapping("code-193", "name-47");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("StrictNudgeMapping rejects moves from archived", () => {
  const item = newStrictNudgeMapping("code-193", "name-47");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
