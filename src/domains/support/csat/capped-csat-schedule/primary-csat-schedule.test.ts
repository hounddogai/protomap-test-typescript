import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryCsatSchedule } from "./primary-csat-schedule.js";

test("PrimaryCsatSchedule starts in proposed", () => {
  const item = newPrimaryCsatSchedule("code-200", "name-262");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryCsatSchedule moves to approved", () => {
  const item = newPrimaryCsatSchedule("code-200", "name-262");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryCsatSchedule rejects moves from withdrawn", () => {
  const item = newPrimaryCsatSchedule("code-200", "name-262");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
