import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathEstimate } from "./path-estimate.js";

test("PathEstimate starts in proposed", () => {
  const item = newPathEstimate("code-413", "title-727");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathEstimate moves to rejected", () => {
  const item = newPathEstimate("code-413", "title-727");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PathEstimate rejects moves from withdrawn", () => {
  const item = newPathEstimate("code-413", "title-727");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
