import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStepRequest } from "./capped-step-request.js";

test("CappedStepRequest starts in proposed", () => {
  const item = newCappedStepRequest("code-796", "label-153");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStepRequest moves to approved", () => {
  const item = newCappedStepRequest("code-796", "label-153");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedStepRequest rejects moves from withdrawn", () => {
  const item = newCappedStepRequest("code-796", "label-153");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
