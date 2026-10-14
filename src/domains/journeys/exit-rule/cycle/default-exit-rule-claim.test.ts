import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultExitRuleClaim } from "./default-exit-rule-claim.js";

test("DefaultExitRuleClaim starts in proposed", () => {
  const item = newDefaultExitRuleClaim("code-708", "label-554");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultExitRuleClaim moves to approved", () => {
  const item = newDefaultExitRuleClaim("code-708", "label-554");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultExitRuleClaim rejects moves from withdrawn", () => {
  const item = newDefaultExitRuleClaim("code-708", "label-554");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
