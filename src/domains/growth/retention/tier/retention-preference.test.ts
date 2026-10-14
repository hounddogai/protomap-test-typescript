import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionPreference } from "./retention-preference.js";

test("RetentionPreference starts in proposed", () => {
  const item = newRetentionPreference("code-985", "name-248");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionPreference moves to rejected", () => {
  const item = newRetentionPreference("code-985", "name-248");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RetentionPreference rejects moves from withdrawn", () => {
  const item = newRetentionPreference("code-985", "name-248");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
