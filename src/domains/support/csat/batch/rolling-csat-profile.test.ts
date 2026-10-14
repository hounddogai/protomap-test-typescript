import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCsatProfile } from "./rolling-csat-profile.js";

test("RollingCsatProfile starts in planned", () => {
  const item = newRollingCsatProfile("code-254", "label-460");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCsatProfile moves to scheduled", () => {
  const item = newRollingCsatProfile("code-254", "label-460");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingCsatProfile rejects moves from cancelled", () => {
  const item = newRollingCsatProfile("code-254", "label-460");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
