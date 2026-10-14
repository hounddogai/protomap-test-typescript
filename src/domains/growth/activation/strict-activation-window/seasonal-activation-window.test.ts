import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalActivationWindow } from "./seasonal-activation-window.js";

test("SeasonalActivationWindow starts in created", () => {
  const item = newSeasonalActivationWindow("code-305", "title-529");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalActivationWindow moves to validated", () => {
  const item = newSeasonalActivationWindow("code-305", "title-529");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SeasonalActivationWindow rejects moves from retired", () => {
  const item = newSeasonalActivationWindow("code-305", "title-529");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
