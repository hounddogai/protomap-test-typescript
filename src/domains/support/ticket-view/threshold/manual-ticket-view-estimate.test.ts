import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTicketViewEstimate } from "./manual-ticket-view-estimate.js";

test("ManualTicketViewEstimate starts in draft", () => {
  const item = newManualTicketViewEstimate("code-500", "title-322");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTicketViewEstimate moves to suspended", () => {
  const item = newManualTicketViewEstimate("code-500", "title-322");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ManualTicketViewEstimate rejects moves from closed", () => {
  const item = newManualTicketViewEstimate("code-500", "title-322");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
