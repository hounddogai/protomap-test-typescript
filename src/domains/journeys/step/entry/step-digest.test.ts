import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepDigest } from "./step-digest.js";

test("StepDigest starts in created", () => {
  const item = newStepDigest("code-363", "label-824");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepDigest moves to validated", () => {
  const item = newStepDigest("code-363", "label-824");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StepDigest rejects moves from retired", () => {
  const item = newStepDigest("code-363", "label-824");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
