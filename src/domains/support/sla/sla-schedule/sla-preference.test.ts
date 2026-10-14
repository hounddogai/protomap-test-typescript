import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaPreference } from "./sla-preference.js";

test("SlaPreference starts in open", () => {
  const item = newSlaPreference("code-56", "label-201");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaPreference moves to resolved", () => {
  const item = newSlaPreference("code-56", "label-201");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SlaPreference rejects moves from archived", () => {
  const item = newSlaPreference("code-56", "label-201");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
