import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelRequest } from "./funnel-request.js";

test("FunnelRequest starts in requested", () => {
  const item = newFunnelRequest("code-691", "title-502");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelRequest moves to expired", () => {
  const item = newFunnelRequest("code-691", "title-502");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("FunnelRequest rejects moves from expired", () => {
  const item = newFunnelRequest("code-691", "title-502");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
