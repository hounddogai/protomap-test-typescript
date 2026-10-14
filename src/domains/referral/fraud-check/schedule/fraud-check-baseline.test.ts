import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckBaseline } from "./fraud-check-baseline.js";

test("FraudCheckBaseline starts in created", () => {
  const item = newFraudCheckBaseline("code-584", "label-738");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckBaseline moves to published", () => {
  const item = newFraudCheckBaseline("code-584", "label-738");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FraudCheckBaseline rejects moves from retired", () => {
  const item = newFraudCheckBaseline("code-584", "label-738");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
