import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFunnelRequest } from "./default-funnel-request.js";

test("DefaultFunnelRequest starts in proposed", () => {
  const item = newDefaultFunnelRequest("code-502", "label-39");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFunnelRequest moves to withdrawn", () => {
  const item = newDefaultFunnelRequest("code-502", "label-39");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("DefaultFunnelRequest rejects moves from withdrawn", () => {
  const item = newDefaultFunnelRequest("code-502", "label-39");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
