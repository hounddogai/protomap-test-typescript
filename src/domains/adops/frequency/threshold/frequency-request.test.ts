import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyRequest } from "./frequency-request.js";

test("FrequencyRequest starts in requested", () => {
  const item = newFrequencyRequest("code-561", "name-478");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyRequest moves to expired", () => {
  const item = newFrequencyRequest("code-561", "name-478");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("FrequencyRequest rejects moves from expired", () => {
  const item = newFrequencyRequest("code-561", "name-478");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
