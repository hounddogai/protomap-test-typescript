import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTierWindow } from "./manual-tier-window.js";

test("ManualTierWindow starts in proposed", () => {
  const item = newManualTierWindow("code-104", "title-706");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTierWindow moves to approved", () => {
  const item = newManualTierWindow("code-104", "title-706");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ManualTierWindow rejects moves from withdrawn", () => {
  const item = newManualTierWindow("code-104", "title-706");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
