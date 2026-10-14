import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualSlaPlan } from "./manual-sla-plan.js";

test("ManualSlaPlan starts in planned", () => {
  const item = newManualSlaPlan("code-770", "label-314");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualSlaPlan moves to cancelled", () => {
  const item = newManualSlaPlan("code-770", "label-314");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("ManualSlaPlan rejects moves from cancelled", () => {
  const item = newManualSlaPlan("code-770", "label-314");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
