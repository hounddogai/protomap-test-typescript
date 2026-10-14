import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEnrollmentOverride } from "./seasonal-enrollment-override.js";

test("SeasonalEnrollmentOverride starts in new", () => {
  const item = newSeasonalEnrollmentOverride("code-315", "label-560");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEnrollmentOverride moves to queued", () => {
  const item = newSeasonalEnrollmentOverride("code-315", "label-560");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalEnrollmentOverride rejects moves from failed", () => {
  const item = newSeasonalEnrollmentOverride("code-315", "label-560");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
