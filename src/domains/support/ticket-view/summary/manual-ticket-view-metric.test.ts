import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTicketViewMetric } from "./manual-ticket-view-metric.js";

test("ManualTicketViewMetric starts in requested", () => {
  const item = newManualTicketViewMetric("code-750", "title-596");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTicketViewMetric moves to granted", () => {
  const item = newManualTicketViewMetric("code-750", "title-596");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualTicketViewMetric rejects moves from expired", () => {
  const item = newManualTicketViewMetric("code-750", "title-596");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
