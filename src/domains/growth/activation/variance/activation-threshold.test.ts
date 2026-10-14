import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationThreshold } from "./activation-threshold.js";

test("ActivationThreshold starts in open", () => {
  const item = newActivationThreshold("code-709", "label-659");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationThreshold moves to resolved", () => {
  const item = newActivationThreshold("code-709", "label-659");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ActivationThreshold rejects moves from archived", () => {
  const item = newActivationThreshold("code-709", "label-659");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
