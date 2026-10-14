import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyDigest } from "./frequency-digest.js";

test("FrequencyDigest starts in open", () => {
  const item = newFrequencyDigest("code-505", "name-591");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyDigest moves to in review", () => {
  const item = newFrequencyDigest("code-505", "name-591");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FrequencyDigest rejects moves from archived", () => {
  const item = newFrequencyDigest("code-505", "name-591");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
