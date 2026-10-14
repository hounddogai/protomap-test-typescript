import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCsatSlot } from "./regional-csat-slot.js";

test("RegionalCsatSlot starts in created", () => {
  const item = newRegionalCsatSlot("code-877", "title-399");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCsatSlot moves to validated", () => {
  const item = newRegionalCsatSlot("code-877", "title-399");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RegionalCsatSlot rejects moves from retired", () => {
  const item = newRegionalCsatSlot("code-877", "title-399");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
