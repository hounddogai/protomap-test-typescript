import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCohortQuota } from "./lenient-cohort-quota.js";

test("LenientCohortQuota starts in planned", () => {
  const item = newLenientCohortQuota("code-78", "name-308");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCohortQuota moves to in progress", () => {
  const item = newLenientCohortQuota("code-78", "name-308");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LenientCohortQuota rejects moves from cancelled", () => {
  const item = newLenientCohortQuota("code-78", "name-308");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
