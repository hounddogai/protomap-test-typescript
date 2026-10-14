import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledCreditRollup } from "./scheduled-credit-rollup.js";

test("ScheduledCreditRollup starts in created", () => {
  const item = newScheduledCreditRollup("code-570", "title-280");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledCreditRollup moves to published", () => {
  const item = newScheduledCreditRollup("code-570", "title-280");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ScheduledCreditRollup rejects moves from retired", () => {
  const item = newScheduledCreditRollup("code-570", "title-280");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
