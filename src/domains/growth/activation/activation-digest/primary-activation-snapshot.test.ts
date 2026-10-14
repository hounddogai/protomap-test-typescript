import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

test("PrimaryActivationSnapshot starts in new", () => {
  const item = newPrimaryActivationSnapshot("code-169", "label-618");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryActivationSnapshot moves to running", () => {
  const item = newPrimaryActivationSnapshot("code-169", "label-618");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PrimaryActivationSnapshot rejects moves from failed", () => {
  const item = newPrimaryActivationSnapshot("code-169", "label-618");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
