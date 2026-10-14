import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySlaSchedule } from "./primary-sla-schedule.js";

test("PrimarySlaSchedule starts in requested", () => {
  const item = newPrimarySlaSchedule("code-931", "name-981");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySlaSchedule moves to granted", () => {
  const item = newPrimarySlaSchedule("code-931", "name-981");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimarySlaSchedule rejects moves from expired", () => {
  const item = newPrimarySlaSchedule("code-931", "name-981");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
