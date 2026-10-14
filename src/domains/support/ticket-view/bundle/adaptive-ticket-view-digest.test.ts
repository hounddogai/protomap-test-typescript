import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveTicketViewDigest } from "./adaptive-ticket-view-digest.js";

test("AdaptiveTicketViewDigest starts in open", () => {
  const item = newAdaptiveTicketViewDigest("code-540", "label-451");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveTicketViewDigest moves to resolved", () => {
  const item = newAdaptiveTicketViewDigest("code-540", "label-451");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("AdaptiveTicketViewDigest rejects moves from archived", () => {
  const item = newAdaptiveTicketViewDigest("code-540", "label-451");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
