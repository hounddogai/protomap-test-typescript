import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainSchedule } from "./domain-schedule.js";

test("DomainSchedule starts in draft", () => {
  const item = newDomainSchedule("code-854", "label-682");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainSchedule moves to pending", () => {
  const item = newDomainSchedule("code-854", "label-682");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DomainSchedule rejects moves from closed", () => {
  const item = newDomainSchedule("code-854", "label-682");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
