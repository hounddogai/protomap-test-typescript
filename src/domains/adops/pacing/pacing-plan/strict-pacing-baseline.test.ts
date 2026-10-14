import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPacingBaseline } from "./strict-pacing-baseline.js";

test("StrictPacingBaseline starts in proposed", () => {
  const item = newStrictPacingBaseline("code-773", "label-202");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPacingBaseline moves to rejected", () => {
  const item = newStrictPacingBaseline("code-773", "label-202");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("StrictPacingBaseline rejects moves from withdrawn", () => {
  const item = newStrictPacingBaseline("code-773", "label-202");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
