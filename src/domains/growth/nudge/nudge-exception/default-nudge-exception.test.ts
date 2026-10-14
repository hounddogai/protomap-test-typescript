import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultNudgeException } from "./default-nudge-exception.js";

test("DefaultNudgeException starts in created", () => {
  const item = newDefaultNudgeException("code-791", "label-69");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultNudgeException moves to validated", () => {
  const item = newDefaultNudgeException("code-791", "label-69");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DefaultNudgeException rejects moves from retired", () => {
  const item = newDefaultNudgeException("code-791", "label-69");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
