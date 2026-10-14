import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaNotice } from "./sla-notice.js";

test("SlaNotice starts in open", () => {
  const item = newSlaNotice("code-560", "name-661");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaNotice moves to reopened", () => {
  const item = newSlaNotice("code-560", "name-661");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SlaNotice rejects moves from archived", () => {
  const item = newSlaNotice("code-560", "name-661");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
