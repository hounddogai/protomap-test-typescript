import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationCycle } from "./activation-cycle.js";

test("ActivationCycle starts in proposed", () => {
  const item = newActivationCycle("code-916", "label-106");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationCycle moves to approved", () => {
  const item = newActivationCycle("code-916", "label-106");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ActivationCycle rejects moves from withdrawn", () => {
  const item = newActivationCycle("code-916", "label-106");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
