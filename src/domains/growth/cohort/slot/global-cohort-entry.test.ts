import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalCohortEntry } from "./global-cohort-entry.js";

test("GlobalCohortEntry starts in idle", () => {
  const item = newGlobalCohortEntry("code-95", "name-476");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalCohortEntry moves to ready", () => {
  const item = newGlobalCohortEntry("code-95", "name-476");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("GlobalCohortEntry rejects moves from stopped", () => {
  const item = newGlobalCohortEntry("code-95", "name-476");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
