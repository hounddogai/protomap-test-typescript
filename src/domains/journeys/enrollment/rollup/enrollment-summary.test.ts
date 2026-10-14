import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentSummary } from "./enrollment-summary.js";

test("EnrollmentSummary starts in created", () => {
  const item = newEnrollmentSummary("code-390", "title-873");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentSummary moves to published", () => {
  const item = newEnrollmentSummary("code-390", "title-873");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("EnrollmentSummary rejects moves from retired", () => {
  const item = newEnrollmentSummary("code-390", "title-873");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
