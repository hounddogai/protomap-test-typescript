import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSenderScore } from "./regional-sender-score.js";

test("RegionalSenderScore starts in requested", () => {
  const item = newRegionalSenderScore("code-175", "name-811");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSenderScore moves to granted", () => {
  const item = newRegionalSenderScore("code-175", "name-811");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalSenderScore rejects moves from expired", () => {
  const item = newRegionalSenderScore("code-175", "name-811");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
