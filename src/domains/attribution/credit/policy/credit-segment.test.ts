import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditSegment } from "./credit-segment.js";

test("CreditSegment starts in created", () => {
  const item = newCreditSegment("code-553", "title-428");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditSegment moves to retired", () => {
  const item = newCreditSegment("code-553", "title-428");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("CreditSegment rejects moves from retired", () => {
  const item = newCreditSegment("code-553", "title-428");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
