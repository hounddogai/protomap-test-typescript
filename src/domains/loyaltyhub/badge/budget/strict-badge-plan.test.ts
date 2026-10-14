import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBadgePlan } from "./strict-badge-plan.js";

test("StrictBadgePlan starts in requested", () => {
  const item = newStrictBadgePlan("code-441", "label-38");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBadgePlan moves to granted", () => {
  const item = newStrictBadgePlan("code-441", "label-38");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictBadgePlan rejects moves from expired", () => {
  const item = newStrictBadgePlan("code-441", "label-38");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
