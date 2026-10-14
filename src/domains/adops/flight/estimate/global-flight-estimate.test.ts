import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFlightEstimate } from "./global-flight-estimate.js";

test("GlobalFlightEstimate starts in created", () => {
  const item = newGlobalFlightEstimate("code-703", "title-733");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFlightEstimate moves to published", () => {
  const item = newGlobalFlightEstimate("code-703", "title-733");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("GlobalFlightEstimate rejects moves from retired", () => {
  const item = newGlobalFlightEstimate("code-703", "title-733");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
