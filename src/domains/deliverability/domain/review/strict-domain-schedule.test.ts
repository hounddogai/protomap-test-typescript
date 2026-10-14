import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictDomainSchedule } from "./strict-domain-schedule.js";

test("StrictDomainSchedule starts in idle", () => {
  const item = newStrictDomainSchedule("code-342", "title-176");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictDomainSchedule moves to ready", () => {
  const item = newStrictDomainSchedule("code-342", "title-176");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("StrictDomainSchedule rejects moves from stopped", () => {
  const item = newStrictDomainSchedule("code-342", "title-176");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
