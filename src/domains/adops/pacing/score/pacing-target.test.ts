import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingTarget } from "./pacing-target.js";

test("PacingTarget starts in proposed", () => {
  const item = newPacingTarget("code-440", "title-810");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingTarget moves to approved", () => {
  const item = newPacingTarget("code-440", "title-810");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PacingTarget rejects moves from withdrawn", () => {
  const item = newPacingTarget("code-440", "title-810");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
