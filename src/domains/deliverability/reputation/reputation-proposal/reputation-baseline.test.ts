import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationBaseline } from "./reputation-baseline.js";

test("ReputationBaseline starts in proposed", () => {
  const item = newReputationBaseline("code-316", "title-99");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationBaseline moves to approved", () => {
  const item = newReputationBaseline("code-316", "title-99");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ReputationBaseline rejects moves from withdrawn", () => {
  const item = newReputationBaseline("code-316", "title-99");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
