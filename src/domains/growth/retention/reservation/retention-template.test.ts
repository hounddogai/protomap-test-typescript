import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionTemplate } from "./retention-template.js";

test("RetentionTemplate starts in proposed", () => {
  const item = newRetentionTemplate("code-23", "name-984");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionTemplate moves to approved", () => {
  const item = newRetentionTemplate("code-23", "name-984");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RetentionTemplate rejects moves from withdrawn", () => {
  const item = newRetentionTemplate("code-23", "name-984");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
