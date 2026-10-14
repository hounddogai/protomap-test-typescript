import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledCohortOverride } from "./scheduled-cohort-override.js";

test("ScheduledCohortOverride starts in proposed", () => {
  const item = newScheduledCohortOverride("code-918", "title-110");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledCohortOverride moves to approved", () => {
  const item = newScheduledCohortOverride("code-918", "title-110");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledCohortOverride rejects moves from withdrawn", () => {
  const item = newScheduledCohortOverride("code-918", "title-110");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
