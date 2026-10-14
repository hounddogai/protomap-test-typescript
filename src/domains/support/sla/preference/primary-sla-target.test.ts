import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySlaTarget } from "./primary-sla-target.js";

test("PrimarySlaTarget starts in proposed", () => {
  const item = newPrimarySlaTarget("code-535", "title-510");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySlaTarget moves to approved", () => {
  const item = newPrimarySlaTarget("code-535", "title-510");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimarySlaTarget rejects moves from withdrawn", () => {
  const item = newPrimarySlaTarget("code-535", "title-510");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
