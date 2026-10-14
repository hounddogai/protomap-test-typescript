import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationMapping } from "./reputation-mapping.js";

test("ReputationMapping starts in proposed", () => {
  const item = newReputationMapping("code-218", "name-579");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationMapping moves to approved", () => {
  const item = newReputationMapping("code-218", "name-579");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ReputationMapping rejects moves from withdrawn", () => {
  const item = newReputationMapping("code-218", "name-579");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
