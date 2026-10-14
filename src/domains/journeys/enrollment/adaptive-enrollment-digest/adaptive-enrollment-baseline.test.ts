import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveEnrollmentBaseline } from "./adaptive-enrollment-baseline.js";

test("AdaptiveEnrollmentBaseline starts in draft", () => {
  const item = newAdaptiveEnrollmentBaseline("code-674", "name-904");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveEnrollmentBaseline moves to suspended", () => {
  const item = newAdaptiveEnrollmentBaseline("code-674", "name-904");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("AdaptiveEnrollmentBaseline rejects moves from closed", () => {
  const item = newAdaptiveEnrollmentBaseline("code-674", "name-904");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
