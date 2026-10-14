import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaBaseline } from "./sla-baseline.js";

test("SlaBaseline starts in planned", () => {
  const item = newSlaBaseline("code-873", "name-455");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaBaseline moves to completed", () => {
  const item = newSlaBaseline("code-873", "name-455");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("SlaBaseline rejects moves from cancelled", () => {
  const item = newSlaBaseline("code-873", "name-455");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
