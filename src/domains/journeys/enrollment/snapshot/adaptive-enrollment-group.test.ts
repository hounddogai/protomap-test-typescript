import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

test("AdaptiveEnrollmentGroup starts in created", () => {
  const item = newAdaptiveEnrollmentGroup("code-980", "label-68");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveEnrollmentGroup moves to published", () => {
  const item = newAdaptiveEnrollmentGroup("code-980", "label-68");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("AdaptiveEnrollmentGroup rejects moves from retired", () => {
  const item = newAdaptiveEnrollmentGroup("code-980", "label-68");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
