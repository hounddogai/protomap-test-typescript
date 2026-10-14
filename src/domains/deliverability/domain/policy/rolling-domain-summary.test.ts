import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingDomainSummary } from "./rolling-domain-summary.js";

test("RollingDomainSummary starts in proposed", () => {
  const item = newRollingDomainSummary("code-823", "title-299");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingDomainSummary moves to rejected", () => {
  const item = newRollingDomainSummary("code-823", "title-299");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingDomainSummary rejects moves from withdrawn", () => {
  const item = newRollingDomainSummary("code-823", "title-299");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
