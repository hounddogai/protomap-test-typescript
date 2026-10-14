import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentForecast } from "./enrollment-forecast.js";

test("EnrollmentForecast starts in draft", () => {
  const item = newEnrollmentForecast("code-415", "label-952");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentForecast moves to pending", () => {
  const item = newEnrollmentForecast("code-415", "label-952");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("EnrollmentForecast rejects moves from closed", () => {
  const item = newEnrollmentForecast("code-415", "label-952");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
