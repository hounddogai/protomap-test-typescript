import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictStepTarget } from "./strict-step-target.js";

test("StrictStepTarget starts in draft", () => {
  const item = newStrictStepTarget("code-675", "title-963");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictStepTarget moves to pending", () => {
  const item = newStrictStepTarget("code-675", "title-963");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StrictStepTarget rejects moves from closed", () => {
  const item = newStrictStepTarget("code-675", "title-963");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
