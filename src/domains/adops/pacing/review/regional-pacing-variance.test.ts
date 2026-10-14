import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPacingVariance } from "./regional-pacing-variance.js";

test("RegionalPacingVariance starts in proposed", () => {
  const item = newRegionalPacingVariance("code-784", "title-842");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPacingVariance moves to approved", () => {
  const item = newRegionalPacingVariance("code-784", "title-842");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RegionalPacingVariance rejects moves from withdrawn", () => {
  const item = newRegionalPacingVariance("code-784", "title-842");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
