import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCreditRecord } from "./strict-credit-record.js";

test("StrictCreditRecord starts in proposed", () => {
  const item = newStrictCreditRecord("code-209", "title-274");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCreditRecord moves to approved", () => {
  const item = newStrictCreditRecord("code-209", "title-274");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StrictCreditRecord rejects moves from withdrawn", () => {
  const item = newStrictCreditRecord("code-209", "title-274");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
