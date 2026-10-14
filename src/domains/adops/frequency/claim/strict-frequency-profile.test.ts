import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFrequencyProfile } from "./strict-frequency-profile.js";

test("StrictFrequencyProfile starts in open", () => {
  const item = newStrictFrequencyProfile("code-226", "title-525");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFrequencyProfile moves to reopened", () => {
  const item = newStrictFrequencyProfile("code-226", "title-525");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("StrictFrequencyProfile rejects moves from archived", () => {
  const item = newStrictFrequencyProfile("code-226", "title-525");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
