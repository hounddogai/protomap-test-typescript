import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewMetric } from "./ticket-view-metric.js";

test("TicketViewMetric starts in open", () => {
  const item = newTicketViewMetric("code-52", "title-792");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewMetric moves to resolved", () => {
  const item = newTicketViewMetric("code-52", "title-792");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("TicketViewMetric rejects moves from archived", () => {
  const item = newTicketViewMetric("code-52", "title-792");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
