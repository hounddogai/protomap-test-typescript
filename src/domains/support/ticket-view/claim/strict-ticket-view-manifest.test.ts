import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTicketViewManifest } from "./strict-ticket-view-manifest.js";

test("StrictTicketViewManifest starts in requested", () => {
  const item = newStrictTicketViewManifest("code-301", "title-193");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTicketViewManifest moves to expired", () => {
  const item = newStrictTicketViewManifest("code-301", "title-193");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("StrictTicketViewManifest rejects moves from expired", () => {
  const item = newStrictTicketViewManifest("code-301", "title-193");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
