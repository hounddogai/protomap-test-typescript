import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortWindow } from "./cohort-window.js";

test("CohortWindow starts in idle", () => {
  const item = newCohortWindow("code-121", "name-1");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortWindow moves to ready", () => {
  const item = newCohortWindow("code-121", "name-1");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("CohortWindow rejects moves from stopped", () => {
  const item = newCohortWindow("code-121", "name-1");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
