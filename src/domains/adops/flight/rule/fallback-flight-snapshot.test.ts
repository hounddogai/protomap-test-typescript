import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFlightSnapshot } from "./fallback-flight-snapshot.js";

test("FallbackFlightSnapshot starts in draft", () => {
  const item = newFallbackFlightSnapshot("code-901", "label-874");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFlightSnapshot moves to pending", () => {
  const item = newFallbackFlightSnapshot("code-901", "label-874");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("FallbackFlightSnapshot rejects moves from closed", () => {
  const item = newFallbackFlightSnapshot("code-901", "label-874");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
