import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTicketViewAudit } from "./legacy-ticket-view-audit.js";

test("LegacyTicketViewAudit starts in created", () => {
  const item = newLegacyTicketViewAudit("code-382", "label-937");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTicketViewAudit moves to validated", () => {
  const item = newLegacyTicketViewAudit("code-382", "label-937");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyTicketViewAudit rejects moves from retired", () => {
  const item = newLegacyTicketViewAudit("code-382", "label-937");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
