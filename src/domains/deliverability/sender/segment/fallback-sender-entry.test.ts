import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSenderEntry } from "./fallback-sender-entry.js";

test("FallbackSenderEntry starts in created", () => {
  const item = newFallbackSenderEntry("code-659", "label-315");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSenderEntry moves to validated", () => {
  const item = newFallbackSenderEntry("code-659", "label-315");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackSenderEntry rejects moves from retired", () => {
  const item = newFallbackSenderEntry("code-659", "label-315");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
