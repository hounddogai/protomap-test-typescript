import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingOverride } from "./pacing-override.js";

test("PacingOverride starts in new", () => {
  const item = newPacingOverride("code-343", "title-61");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingOverride moves to queued", () => {
  const item = newPacingOverride("code-343", "title-61");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PacingOverride rejects moves from failed", () => {
  const item = newPacingOverride("code-343", "title-61");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
