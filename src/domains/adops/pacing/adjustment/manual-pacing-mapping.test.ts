import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPacingMapping } from "./manual-pacing-mapping.js";

test("ManualPacingMapping starts in requested", () => {
  const item = newManualPacingMapping("code-949", "label-638");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPacingMapping moves to revoked", () => {
  const item = newManualPacingMapping("code-949", "label-638");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualPacingMapping rejects moves from expired", () => {
  const item = newManualPacingMapping("code-949", "label-638");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
