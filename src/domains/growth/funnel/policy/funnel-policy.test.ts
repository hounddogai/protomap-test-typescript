import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelPolicy } from "./funnel-policy.js";

test("FunnelPolicy starts in new", () => {
  const item = newFunnelPolicy("code-204", "name-167");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelPolicy moves to queued", () => {
  const item = newFunnelPolicy("code-204", "name-167");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FunnelPolicy rejects moves from failed", () => {
  const item = newFunnelPolicy("code-204", "name-167");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
