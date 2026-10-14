import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSenderMapping } from "./regional-sender-mapping.js";

test("RegionalSenderMapping starts in planned", () => {
  const item = newRegionalSenderMapping("code-569", "label-347");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSenderMapping moves to cancelled", () => {
  const item = newRegionalSenderMapping("code-569", "label-347");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RegionalSenderMapping rejects moves from cancelled", () => {
  const item = newRegionalSenderMapping("code-569", "label-347");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
