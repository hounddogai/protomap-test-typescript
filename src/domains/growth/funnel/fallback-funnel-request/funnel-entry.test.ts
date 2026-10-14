import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelEntry } from "./funnel-entry.js";

test("FunnelEntry starts in requested", () => {
  const item = newFunnelEntry("code-751", "label-378");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelEntry moves to granted", () => {
  const item = newFunnelEntry("code-751", "label-378");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FunnelEntry rejects moves from expired", () => {
  const item = newFunnelEntry("code-751", "label-378");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
