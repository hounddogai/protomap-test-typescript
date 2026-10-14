import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEnrollmentPolicy } from "./seasonal-enrollment-policy.js";

test("SeasonalEnrollmentPolicy starts in proposed", () => {
  const item = newSeasonalEnrollmentPolicy("code-280", "label-44");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEnrollmentPolicy moves to approved", () => {
  const item = newSeasonalEnrollmentPolicy("code-280", "label-44");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("SeasonalEnrollmentPolicy rejects moves from withdrawn", () => {
  const item = newSeasonalEnrollmentPolicy("code-280", "label-44");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
