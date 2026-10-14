import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDoubleOptInAllocation } from "./scheduled-double-opt-in-allocation.js";

test("ScheduledDoubleOptInAllocation starts in requested", () => {
  const item = newScheduledDoubleOptInAllocation("code-80", "label-111");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDoubleOptInAllocation moves to expired", () => {
  const item = newScheduledDoubleOptInAllocation("code-80", "label-111");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ScheduledDoubleOptInAllocation rejects moves from expired", () => {
  const item = newScheduledDoubleOptInAllocation("code-80", "label-111");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
