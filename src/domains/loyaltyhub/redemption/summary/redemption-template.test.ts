import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionTemplate } from "./redemption-template.js";

test("RedemptionTemplate starts in proposed", () => {
  const item = newRedemptionTemplate("code-311", "title-547");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionTemplate moves to approved", () => {
  const item = newRedemptionTemplate("code-311", "title-547");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RedemptionTemplate rejects moves from withdrawn", () => {
  const item = newRedemptionTemplate("code-311", "title-547");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
