import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingBaseline } from "./pacing-baseline.js";

test("PacingBaseline starts in requested", () => {
  const item = newPacingBaseline("code-946", "title-306");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingBaseline moves to granted", () => {
  const item = newPacingBaseline("code-946", "title-306");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PacingBaseline rejects moves from expired", () => {
  const item = newPacingBaseline("code-946", "title-306");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
