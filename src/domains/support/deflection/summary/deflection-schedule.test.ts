import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionSchedule } from "./deflection-schedule.js";

test("DeflectionSchedule starts in created", () => {
  const item = newDeflectionSchedule("code-376", "title-903");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionSchedule moves to validated", () => {
  const item = newDeflectionSchedule("code-376", "title-903");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DeflectionSchedule rejects moves from retired", () => {
  const item = newDeflectionSchedule("code-376", "title-903");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
