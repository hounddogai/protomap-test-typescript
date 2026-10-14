import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDomainRequest } from "./scheduled-domain-request.js";

test("ScheduledDomainRequest starts in requested", () => {
  const item = newScheduledDomainRequest("code-927", "name-329");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDomainRequest moves to expired", () => {
  const item = newScheduledDomainRequest("code-927", "name-329");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ScheduledDomainRequest rejects moves from expired", () => {
  const item = newScheduledDomainRequest("code-927", "name-329");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
