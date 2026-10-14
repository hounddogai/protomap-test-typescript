import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackJourneyTemplate } from "./fallback-journey-template.js";

test("FallbackJourneyTemplate starts in requested", () => {
  const item = newFallbackJourneyTemplate("code-5", "title-226");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackJourneyTemplate moves to granted", () => {
  const item = newFallbackJourneyTemplate("code-5", "title-226");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FallbackJourneyTemplate rejects moves from expired", () => {
  const item = newFallbackJourneyTemplate("code-5", "title-226");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
