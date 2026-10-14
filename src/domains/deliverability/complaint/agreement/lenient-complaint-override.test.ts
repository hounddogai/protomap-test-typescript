import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientComplaintOverride } from "./lenient-complaint-override.js";

test("LenientComplaintOverride starts in draft", () => {
  const item = newLenientComplaintOverride("code-820", "name-154");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientComplaintOverride moves to active", () => {
  const item = newLenientComplaintOverride("code-820", "name-154");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LenientComplaintOverride rejects moves from closed", () => {
  const item = newLenientComplaintOverride("code-820", "name-154");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
