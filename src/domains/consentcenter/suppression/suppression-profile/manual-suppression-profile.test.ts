import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualSuppressionProfile } from "./manual-suppression-profile.js";

test("ManualSuppressionProfile starts in requested", () => {
  const item = newManualSuppressionProfile("code-145", "name-533");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualSuppressionProfile moves to granted", () => {
  const item = newManualSuppressionProfile("code-145", "name-533");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualSuppressionProfile rejects moves from expired", () => {
  const item = newManualSuppressionProfile("code-145", "name-533");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
