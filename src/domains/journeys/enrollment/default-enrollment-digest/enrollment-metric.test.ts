import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentMetric } from "./enrollment-metric.js";

test("EnrollmentMetric starts in created", () => {
  const item = newEnrollmentMetric("code-455", "name-72");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentMetric moves to published", () => {
  const item = newEnrollmentMetric("code-455", "name-72");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("EnrollmentMetric rejects moves from retired", () => {
  const item = newEnrollmentMetric("code-455", "name-72");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
