import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSenderEntry } from "./pending-sender-entry.js";

test("PendingSenderEntry starts in draft", () => {
  const item = newPendingSenderEntry("code-938", "label-478");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSenderEntry moves to pending", () => {
  const item = newPendingSenderEntry("code-938", "label-478");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PendingSenderEntry rejects moves from closed", () => {
  const item = newPendingSenderEntry("code-938", "label-478");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
