import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEnrollmentWindow } from "./seasonal-enrollment-window.js";

test("SeasonalEnrollmentWindow starts in idle", () => {
  const item = newSeasonalEnrollmentWindow("code-874", "title-278");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEnrollmentWindow moves to warming", () => {
  const item = newSeasonalEnrollmentWindow("code-874", "title-278");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalEnrollmentWindow rejects moves from stopped", () => {
  const item = newSeasonalEnrollmentWindow("code-874", "title-278");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
