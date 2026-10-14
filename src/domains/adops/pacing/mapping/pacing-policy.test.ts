import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingPolicy } from "./pacing-policy.js";

test("PacingPolicy starts in draft", () => {
  const item = newPacingPolicy("code-110", "label-638");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingPolicy moves to active", () => {
  const item = newPacingPolicy("code-110", "label-638");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PacingPolicy rejects moves from closed", () => {
  const item = newPacingPolicy("code-110", "label-638");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
