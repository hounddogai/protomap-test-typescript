import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingDomainThreshold } from "./pending-domain-threshold.js";

test("PendingDomainThreshold starts in proposed", () => {
  const item = newPendingDomainThreshold("code-836", "name-539");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingDomainThreshold moves to approved", () => {
  const item = newPendingDomainThreshold("code-836", "name-539");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingDomainThreshold rejects moves from withdrawn", () => {
  const item = newPendingDomainThreshold("code-836", "name-539");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
