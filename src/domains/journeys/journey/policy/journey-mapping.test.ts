import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyMapping } from "./journey-mapping.js";

test("JourneyMapping starts in requested", () => {
  const item = newJourneyMapping("code-399", "title-640");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyMapping moves to granted", () => {
  const item = newJourneyMapping("code-399", "title-640");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("JourneyMapping rejects moves from expired", () => {
  const item = newJourneyMapping("code-399", "title-640");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
