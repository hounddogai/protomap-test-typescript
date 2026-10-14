import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderVariance } from "./sender-variance.js";

test("SenderVariance starts in created", () => {
  const item = newSenderVariance("code-490", "title-467");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderVariance moves to validated", () => {
  const item = newSenderVariance("code-490", "title-467");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SenderVariance rejects moves from retired", () => {
  const item = newSenderVariance("code-490", "title-467");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
