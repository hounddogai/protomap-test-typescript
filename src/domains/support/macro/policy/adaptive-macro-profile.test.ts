import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveMacroProfile } from "./adaptive-macro-profile.js";

test("AdaptiveMacroProfile starts in proposed", () => {
  const item = newAdaptiveMacroProfile("code-40", "title-26");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveMacroProfile moves to rejected", () => {
  const item = newAdaptiveMacroProfile("code-40", "title-26");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("AdaptiveMacroProfile rejects moves from withdrawn", () => {
  const item = newAdaptiveMacroProfile("code-40", "title-26");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
