import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalComplaintOverride } from "./global-complaint-override.js";

test("GlobalComplaintOverride starts in planned", () => {
  const item = newGlobalComplaintOverride("code-581", "title-143");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalComplaintOverride moves to in progress", () => {
  const item = newGlobalComplaintOverride("code-581", "title-143");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("GlobalComplaintOverride rejects moves from cancelled", () => {
  const item = newGlobalComplaintOverride("code-581", "title-143");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
