import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupBaseline } from "./warmup-baseline.js";

test("WarmupBaseline starts in proposed", () => {
  const item = newWarmupBaseline("code-905", "name-106");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupBaseline moves to rejected", () => {
  const item = newWarmupBaseline("code-905", "name-106");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WarmupBaseline rejects moves from withdrawn", () => {
  const item = newWarmupBaseline("code-905", "name-106");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
