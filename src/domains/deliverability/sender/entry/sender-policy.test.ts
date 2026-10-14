import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderPolicy } from "./sender-policy.js";

test("SenderPolicy starts in proposed", () => {
  const item = newSenderPolicy("code-376", "label-597");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderPolicy moves to withdrawn", () => {
  const item = newSenderPolicy("code-376", "label-597");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("SenderPolicy rejects moves from withdrawn", () => {
  const item = newSenderPolicy("code-376", "label-597");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
