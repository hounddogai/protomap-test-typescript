import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSlaTier } from "./rolling-sla-tier.js";

test("RollingSlaTier starts in planned", () => {
  const item = newRollingSlaTier("code-861", "label-848");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSlaTier moves to scheduled", () => {
  const item = newRollingSlaTier("code-861", "label-848");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingSlaTier rejects moves from cancelled", () => {
  const item = newRollingSlaTier("code-861", "label-848");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
