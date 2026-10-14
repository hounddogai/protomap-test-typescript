import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingDomainVariance } from "./rolling-domain-variance.js";

test("RollingDomainVariance starts in draft", () => {
  const item = newRollingDomainVariance("code-717", "name-737");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingDomainVariance moves to pending", () => {
  const item = newRollingDomainVariance("code-717", "name-737");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RollingDomainVariance rejects moves from closed", () => {
  const item = newRollingDomainVariance("code-717", "name-737");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
