import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutTier } from "./opt-out-tier.js";

test("OptOutTier starts in created", () => {
  const item = newOptOutTier("code-582", "title-832");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutTier moves to validated", () => {
  const item = newOptOutTier("code-582", "title-832");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("OptOutTier rejects moves from retired", () => {
  const item = newOptOutTier("code-582", "title-832");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
