import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofPlan } from "./proof-plan.js";

test("ProofPlan starts in draft", () => {
  const item = newProofPlan("code-295", "title-35");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofPlan moves to active", () => {
  const item = newProofPlan("code-295", "title-35");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ProofPlan rejects moves from closed", () => {
  const item = newProofPlan("code-295", "title-35");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
