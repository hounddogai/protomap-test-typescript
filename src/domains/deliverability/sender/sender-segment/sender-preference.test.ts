import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderPreference } from "./sender-preference.js";

test("SenderPreference starts in proposed", () => {
  const item = newSenderPreference("code-291", "name-970");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderPreference moves to rejected", () => {
  const item = newSenderPreference("code-291", "name-970");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SenderPreference rejects moves from withdrawn", () => {
  const item = newSenderPreference("code-291", "name-970");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
