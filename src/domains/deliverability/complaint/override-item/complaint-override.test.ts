import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintOverride } from "./complaint-override.js";

test("ComplaintOverride starts in idle", () => {
  const item = newComplaintOverride("code-66", "label-113");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintOverride moves to stopped", () => {
  const item = newComplaintOverride("code-66", "label-113");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("ComplaintOverride rejects moves from stopped", () => {
  const item = newComplaintOverride("code-66", "label-113");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
