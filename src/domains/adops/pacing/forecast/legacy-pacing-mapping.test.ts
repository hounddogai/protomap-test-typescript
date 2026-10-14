import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPacingMapping } from "./legacy-pacing-mapping.js";

test("LegacyPacingMapping starts in requested", () => {
  const item = newLegacyPacingMapping("code-936", "title-472");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPacingMapping moves to revoked", () => {
  const item = newLegacyPacingMapping("code-936", "title-472");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LegacyPacingMapping rejects moves from expired", () => {
  const item = newLegacyPacingMapping("code-936", "title-472");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
