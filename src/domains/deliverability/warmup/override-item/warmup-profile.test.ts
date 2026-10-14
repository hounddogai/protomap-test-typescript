import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupProfile } from "./warmup-profile.js";

test("WarmupProfile starts in open", () => {
  const item = newWarmupProfile("code-940", "name-18");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupProfile moves to reopened", () => {
  const item = newWarmupProfile("code-940", "name-18");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("WarmupProfile rejects moves from archived", () => {
  const item = newWarmupProfile("code-940", "name-18");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
