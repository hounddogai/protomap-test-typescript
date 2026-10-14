import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelRecord } from "./funnel-record.js";

test("FunnelRecord starts in created", () => {
  const item = newFunnelRecord("code-759", "label-854");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelRecord moves to validated", () => {
  const item = newFunnelRecord("code-759", "label-854");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FunnelRecord rejects moves from retired", () => {
  const item = newFunnelRecord("code-759", "label-854");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
