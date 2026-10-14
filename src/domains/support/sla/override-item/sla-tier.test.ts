import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaTier } from "./sla-tier.js";

test("SlaTier starts in open", () => {
  const item = newSlaTier("code-814", "name-152");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaTier moves to archived", () => {
  const item = newSlaTier("code-814", "name-152");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("SlaTier rejects moves from archived", () => {
  const item = newSlaTier("code-814", "name-152");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
