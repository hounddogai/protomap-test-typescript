import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryDomainSchedule } from "./primary-domain-schedule.js";

test("PrimaryDomainSchedule starts in draft", () => {
  const item = newPrimaryDomainSchedule("code-831", "title-374");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryDomainSchedule moves to pending", () => {
  const item = newPrimaryDomainSchedule("code-831", "title-374");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryDomainSchedule rejects moves from closed", () => {
  const item = newPrimaryDomainSchedule("code-831", "title-374");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
