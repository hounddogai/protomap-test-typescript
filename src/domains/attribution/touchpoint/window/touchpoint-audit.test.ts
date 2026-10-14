import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointAudit } from "./touchpoint-audit.js";

test("TouchpointAudit starts in requested", () => {
  const item = newTouchpointAudit("code-352", "name-561");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointAudit moves to granted", () => {
  const item = newTouchpointAudit("code-352", "name-561");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TouchpointAudit rejects moves from expired", () => {
  const item = newTouchpointAudit("code-352", "name-561");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
