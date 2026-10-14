import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingVariance } from "./pacing-variance.js";

test("PacingVariance starts in requested", () => {
  const item = newPacingVariance("code-315", "name-296");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingVariance moves to granted", () => {
  const item = newPacingVariance("code-315", "name-296");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PacingVariance rejects moves from expired", () => {
  const item = newPacingVariance("code-315", "name-296");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
