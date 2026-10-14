import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackDomainSchedule } from "./fallback-domain-schedule.js";

test("FallbackDomainSchedule starts in open", () => {
  const item = newFallbackDomainSchedule("code-922", "label-959");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackDomainSchedule moves to archived", () => {
  const item = newFallbackDomainSchedule("code-922", "label-959");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("FallbackDomainSchedule rejects moves from archived", () => {
  const item = newFallbackDomainSchedule("code-922", "label-959");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
