import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalFunnelRequest } from "./regional-funnel-request.js";

test("RegionalFunnelRequest starts in proposed", () => {
  const item = newRegionalFunnelRequest("code-868", "title-809");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalFunnelRequest moves to rejected", () => {
  const item = newRegionalFunnelRequest("code-868", "title-809");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RegionalFunnelRequest rejects moves from withdrawn", () => {
  const item = newRegionalFunnelRequest("code-868", "title-809");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
