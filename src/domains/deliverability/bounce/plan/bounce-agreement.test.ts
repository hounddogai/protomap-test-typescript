import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceAgreement } from "./bounce-agreement.js";

test("BounceAgreement starts in idle", () => {
  const item = newBounceAgreement("code-509", "title-430");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceAgreement moves to ready", () => {
  const item = newBounceAgreement("code-509", "title-430");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BounceAgreement rejects moves from stopped", () => {
  const item = newBounceAgreement("code-509", "title-430");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
