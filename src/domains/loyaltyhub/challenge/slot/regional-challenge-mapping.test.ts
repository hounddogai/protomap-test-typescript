import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalChallengeMapping } from "./regional-challenge-mapping.js";

test("RegionalChallengeMapping starts in proposed", () => {
  const item = newRegionalChallengeMapping("code-781", "label-59");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalChallengeMapping moves to rejected", () => {
  const item = newRegionalChallengeMapping("code-781", "label-59");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RegionalChallengeMapping rejects moves from withdrawn", () => {
  const item = newRegionalChallengeMapping("code-781", "label-59");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
