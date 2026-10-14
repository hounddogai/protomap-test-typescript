import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPacingBundle } from "./strict-pacing-bundle.js";

test("StrictPacingBundle starts in proposed", () => {
  const item = newStrictPacingBundle("code-578", "name-319");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPacingBundle moves to approved", () => {
  const item = newStrictPacingBundle("code-578", "name-319");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StrictPacingBundle rejects moves from withdrawn", () => {
  const item = newStrictPacingBundle("code-578", "name-319");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
