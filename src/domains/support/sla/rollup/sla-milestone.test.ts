import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaMilestone } from "./sla-milestone.js";

test("SlaMilestone starts in requested", () => {
  const item = newSlaMilestone("code-853", "name-454");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaMilestone moves to revoked", () => {
  const item = newSlaMilestone("code-853", "name-454");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("SlaMilestone rejects moves from expired", () => {
  const item = newSlaMilestone("code-853", "name-454");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
