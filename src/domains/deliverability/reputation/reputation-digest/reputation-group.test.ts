import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationGroup } from "./reputation-group.js";

test("ReputationGroup starts in proposed", () => {
  const item = newReputationGroup("code-287", "label-385");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationGroup moves to rejected", () => {
  const item = newReputationGroup("code-287", "label-385");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ReputationGroup rejects moves from withdrawn", () => {
  const item = newReputationGroup("code-287", "label-385");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
