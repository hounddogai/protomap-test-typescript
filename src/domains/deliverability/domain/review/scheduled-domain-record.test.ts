import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDomainRecord } from "./scheduled-domain-record.js";

test("ScheduledDomainRecord starts in requested", () => {
  const item = newScheduledDomainRecord("code-914", "title-216");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDomainRecord moves to granted", () => {
  const item = newScheduledDomainRecord("code-914", "title-216");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledDomainRecord rejects moves from expired", () => {
  const item = newScheduledDomainRecord("code-914", "title-216");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
