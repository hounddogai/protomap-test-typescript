import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPacingTemplate } from "./lenient-pacing-template.js";

test("LenientPacingTemplate starts in new", () => {
  const item = newLenientPacingTemplate("code-628", "label-60");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPacingTemplate moves to queued", () => {
  const item = newLenientPacingTemplate("code-628", "label-60");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientPacingTemplate rejects moves from failed", () => {
  const item = newLenientPacingTemplate("code-628", "label-60");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
