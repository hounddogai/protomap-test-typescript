import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainPlan } from "./domain-plan.js";

test("DomainPlan starts in idle", () => {
  const item = newDomainPlan("code-271", "title-502");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainPlan moves to warming", () => {
  const item = newDomainPlan("code-271", "title-502");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("DomainPlan rejects moves from stopped", () => {
  const item = newDomainPlan("code-271", "title-502");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
