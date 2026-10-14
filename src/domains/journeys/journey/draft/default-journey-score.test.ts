import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultJourneyScore } from "./default-journey-score.js";

test("DefaultJourneyScore starts in requested", () => {
  const item = newDefaultJourneyScore("code-138", "name-643");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultJourneyScore moves to granted", () => {
  const item = newDefaultJourneyScore("code-138", "name-643");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DefaultJourneyScore rejects moves from expired", () => {
  const item = newDefaultJourneyScore("code-138", "name-643");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
