import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

test("ManualTicketViewAgreement starts in new", () => {
  const item = newManualTicketViewAgreement("code-103", "title-347");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTicketViewAgreement moves to failed", () => {
  const item = newManualTicketViewAgreement("code-103", "title-347");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ManualTicketViewAgreement rejects moves from failed", () => {
  const item = newManualTicketViewAgreement("code-103", "title-347");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
