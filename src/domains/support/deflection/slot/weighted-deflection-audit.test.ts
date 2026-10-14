import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDeflectionAudit } from "./weighted-deflection-audit.js";

test("WeightedDeflectionAudit starts in new", () => {
  const item = newWeightedDeflectionAudit("code-442", "title-868");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDeflectionAudit moves to done", () => {
  const item = newWeightedDeflectionAudit("code-442", "title-868");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("WeightedDeflectionAudit rejects moves from failed", () => {
  const item = newWeightedDeflectionAudit("code-442", "title-868");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
