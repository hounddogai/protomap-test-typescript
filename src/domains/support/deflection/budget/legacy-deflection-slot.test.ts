import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDeflectionSlot } from "./legacy-deflection-slot.js";

test("LegacyDeflectionSlot starts in created", () => {
  const item = newLegacyDeflectionSlot("code-353", "label-364");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDeflectionSlot moves to validated", () => {
  const item = newLegacyDeflectionSlot("code-353", "label-364");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyDeflectionSlot rejects moves from retired", () => {
  const item = newLegacyDeflectionSlot("code-353", "label-364");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
