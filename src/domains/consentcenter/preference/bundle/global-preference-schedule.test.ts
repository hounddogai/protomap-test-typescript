import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPreferenceSchedule } from "./global-preference-schedule.js";

test("GlobalPreferenceSchedule starts in created", () => {
  const item = newGlobalPreferenceSchedule("code-843", "title-777");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPreferenceSchedule moves to validated", () => {
  const item = newGlobalPreferenceSchedule("code-843", "title-777");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("GlobalPreferenceSchedule rejects moves from retired", () => {
  const item = newGlobalPreferenceSchedule("code-843", "title-777");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
