import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredStepNotice } from "./tiered-step-notice.js";

test("TieredStepNotice starts in new", () => {
  const item = newTieredStepNotice("code-998", "title-677");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredStepNotice moves to queued", () => {
  const item = newTieredStepNotice("code-998", "title-677");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredStepNotice rejects moves from failed", () => {
  const item = newTieredStepNotice("code-998", "title-677");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
