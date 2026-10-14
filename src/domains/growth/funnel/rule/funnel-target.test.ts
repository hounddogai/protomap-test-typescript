import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelTarget } from "./funnel-target.js";

test("FunnelTarget starts in proposed", () => {
  const item = newFunnelTarget("code-246", "name-267");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelTarget moves to approved", () => {
  const item = newFunnelTarget("code-246", "name-267");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FunnelTarget rejects moves from withdrawn", () => {
  const item = newFunnelTarget("code-246", "name-267");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
