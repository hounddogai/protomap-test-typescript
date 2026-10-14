import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFunnelTarget } from "./primary-funnel-target.js";

test("PrimaryFunnelTarget starts in proposed", () => {
  const item = newPrimaryFunnelTarget("code-699", "label-793");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFunnelTarget moves to approved", () => {
  const item = newPrimaryFunnelTarget("code-699", "label-793");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryFunnelTarget rejects moves from withdrawn", () => {
  const item = newPrimaryFunnelTarget("code-699", "label-793");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
