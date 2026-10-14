import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

test("StrictExitRuleCycle starts in proposed", () => {
  const item = newStrictExitRuleCycle("code-957", "name-716");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictExitRuleCycle moves to approved", () => {
  const item = newStrictExitRuleCycle("code-957", "name-716");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StrictExitRuleCycle rejects moves from withdrawn", () => {
  const item = newStrictExitRuleCycle("code-957", "name-716");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
