import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelProfile } from "./funnel-profile.js";

test("FunnelProfile starts in created", () => {
  const item = newFunnelProfile("code-114", "title-925");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelProfile moves to retired", () => {
  const item = newFunnelProfile("code-114", "title-925");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("FunnelProfile rejects moves from retired", () => {
  const item = newFunnelProfile("code-114", "title-925");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
