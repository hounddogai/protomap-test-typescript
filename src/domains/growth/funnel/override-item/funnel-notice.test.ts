import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelNotice } from "./funnel-notice.js";

test("FunnelNotice starts in requested", () => {
  const item = newFunnelNotice("code-929", "name-853");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelNotice moves to revoked", () => {
  const item = newFunnelNotice("code-929", "name-853");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("FunnelNotice rejects moves from expired", () => {
  const item = newFunnelNotice("code-929", "name-853");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
