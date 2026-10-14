import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaProfile } from "./sla-profile.js";

test("SlaProfile starts in open", () => {
  const item = newSlaProfile("code-53", "name-878");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaProfile moves to reopened", () => {
  const item = newSlaProfile("code-53", "name-878");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SlaProfile rejects moves from archived", () => {
  const item = newSlaProfile("code-53", "name-878");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
