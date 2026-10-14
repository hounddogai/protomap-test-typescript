import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckNotice } from "./fraud-check-notice.js";

test("FraudCheckNotice starts in proposed", () => {
  const item = newFraudCheckNotice("code-685", "label-497");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckNotice moves to rejected", () => {
  const item = newFraudCheckNotice("code-685", "label-497");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FraudCheckNotice rejects moves from withdrawn", () => {
  const item = newFraudCheckNotice("code-685", "label-497");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
