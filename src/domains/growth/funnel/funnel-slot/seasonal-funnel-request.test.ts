import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalFunnelRequest } from "./seasonal-funnel-request.js";

test("SeasonalFunnelRequest starts in draft", () => {
  const item = newSeasonalFunnelRequest("code-178", "name-546");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalFunnelRequest moves to closed", () => {
  const item = newSeasonalFunnelRequest("code-178", "name-546");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("SeasonalFunnelRequest rejects moves from closed", () => {
  const item = newSeasonalFunnelRequest("code-178", "name-546");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
