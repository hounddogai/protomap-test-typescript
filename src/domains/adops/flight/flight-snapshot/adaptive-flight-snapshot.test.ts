import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

test("AdaptiveFlightSnapshot starts in draft", () => {
  const item = newAdaptiveFlightSnapshot("code-305", "label-578");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFlightSnapshot moves to pending", () => {
  const item = newAdaptiveFlightSnapshot("code-305", "label-578");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptiveFlightSnapshot rejects moves from closed", () => {
  const item = newAdaptiveFlightSnapshot("code-305", "label-578");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
