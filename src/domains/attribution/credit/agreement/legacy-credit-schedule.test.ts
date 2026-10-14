import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCreditSchedule } from "./legacy-credit-schedule.js";

test("LegacyCreditSchedule starts in created", () => {
  const item = newLegacyCreditSchedule("code-196", "label-388");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCreditSchedule moves to validated", () => {
  const item = newLegacyCreditSchedule("code-196", "label-388");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyCreditSchedule rejects moves from retired", () => {
  const item = newLegacyCreditSchedule("code-196", "label-388");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
