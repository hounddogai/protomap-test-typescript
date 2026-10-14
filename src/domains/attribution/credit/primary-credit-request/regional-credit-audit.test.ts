import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCreditAudit } from "./regional-credit-audit.js";

test("RegionalCreditAudit starts in proposed", () => {
  const item = newRegionalCreditAudit("code-837", "title-253");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCreditAudit moves to approved", () => {
  const item = newRegionalCreditAudit("code-837", "title-253");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RegionalCreditAudit rejects moves from withdrawn", () => {
  const item = newRegionalCreditAudit("code-837", "title-253");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
