import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFunnelDigest } from "./rolling-funnel-digest.js";

test("RollingFunnelDigest starts in planned", () => {
  const item = newRollingFunnelDigest("code-42", "title-762");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFunnelDigest moves to in progress", () => {
  const item = newRollingFunnelDigest("code-42", "title-762");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingFunnelDigest rejects moves from cancelled", () => {
  const item = newRollingFunnelDigest("code-42", "title-762");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
