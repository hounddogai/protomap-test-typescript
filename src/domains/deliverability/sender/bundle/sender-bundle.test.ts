import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderBundle } from "./sender-bundle.js";

test("SenderBundle starts in requested", () => {
  const item = newSenderBundle("code-213", "label-207");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderBundle moves to granted", () => {
  const item = newSenderBundle("code-213", "label-207");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SenderBundle rejects moves from expired", () => {
  const item = newSenderBundle("code-213", "label-207");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
