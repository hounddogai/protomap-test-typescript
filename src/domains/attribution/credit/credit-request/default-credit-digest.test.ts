import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultCreditDigest } from "./default-credit-digest.js";

test("DefaultCreditDigest starts in open", () => {
  const item = newDefaultCreditDigest("code-837", "label-513");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultCreditDigest moves to archived", () => {
  const item = newDefaultCreditDigest("code-837", "label-513");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("DefaultCreditDigest rejects moves from archived", () => {
  const item = newDefaultCreditDigest("code-837", "label-513");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
