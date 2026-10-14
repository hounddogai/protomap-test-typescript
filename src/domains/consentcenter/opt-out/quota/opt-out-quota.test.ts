import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutQuota } from "./opt-out-quota.js";

test("OptOutQuota starts in created", () => {
  const item = newOptOutQuota("code-605", "title-309");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutQuota moves to published", () => {
  const item = newOptOutQuota("code-605", "title-309");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("OptOutQuota rejects moves from retired", () => {
  const item = newOptOutQuota("code-605", "title-309");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
