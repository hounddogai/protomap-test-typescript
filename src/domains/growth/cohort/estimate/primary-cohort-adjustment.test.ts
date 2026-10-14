import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryCohortAdjustment } from "./primary-cohort-adjustment.js";

test("PrimaryCohortAdjustment starts in requested", () => {
  const item = newPrimaryCohortAdjustment("code-898", "label-82");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryCohortAdjustment moves to expired", () => {
  const item = newPrimaryCohortAdjustment("code-898", "label-82");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PrimaryCohortAdjustment rejects moves from expired", () => {
  const item = newPrimaryCohortAdjustment("code-898", "label-82");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
