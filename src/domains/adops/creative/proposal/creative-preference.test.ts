import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativePreference } from "./creative-preference.js";

test("CreativePreference starts in idle", () => {
  const item = newCreativePreference("code-753", "label-813");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativePreference moves to draining", () => {
  const item = newCreativePreference("code-753", "label-813");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("CreativePreference rejects moves from stopped", () => {
  const item = newCreativePreference("code-753", "label-813");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
