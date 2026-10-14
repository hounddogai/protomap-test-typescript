import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionSlot } from "./retention-slot.js";

test("RetentionSlot starts in proposed", () => {
  const item = newRetentionSlot("code-445", "title-997");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionSlot moves to approved", () => {
  const item = newRetentionSlot("code-445", "title-997");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RetentionSlot rejects moves from withdrawn", () => {
  const item = newRetentionSlot("code-445", "title-997");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
