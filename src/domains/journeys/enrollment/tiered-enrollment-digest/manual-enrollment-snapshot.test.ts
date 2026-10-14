import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

test("ManualEnrollmentSnapshot starts in created", () => {
  const item = newManualEnrollmentSnapshot("code-694", "label-284");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualEnrollmentSnapshot moves to published", () => {
  const item = newManualEnrollmentSnapshot("code-694", "label-284");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ManualEnrollmentSnapshot rejects moves from retired", () => {
  const item = newManualEnrollmentSnapshot("code-694", "label-284");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
