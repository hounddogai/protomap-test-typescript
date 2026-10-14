import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalActivationException } from "./seasonal-activation-exception.js";

test("SeasonalActivationException starts in created", () => {
  const item = newSeasonalActivationException("code-807", "title-337");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalActivationException moves to published", () => {
  const item = newSeasonalActivationException("code-807", "title-337");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SeasonalActivationException rejects moves from retired", () => {
  const item = newSeasonalActivationException("code-807", "title-337");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
