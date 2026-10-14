import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelException } from "./funnel-exception.js";

test("FunnelException starts in requested", () => {
  const item = newFunnelException("code-291", "label-546");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelException moves to granted", () => {
  const item = newFunnelException("code-291", "label-546");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FunnelException rejects moves from expired", () => {
  const item = newFunnelException("code-291", "label-546");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
