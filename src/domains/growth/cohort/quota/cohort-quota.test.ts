import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortQuota } from "./cohort-quota.js";

test("CohortQuota starts in draft", () => {
  const item = newCohortQuota("code-915", "name-516");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortQuota moves to pending", () => {
  const item = newCohortQuota("code-915", "name-516");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CohortQuota rejects moves from closed", () => {
  const item = newCohortQuota("code-915", "name-516");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
