import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSenderTemplate } from "./adaptive-sender-template.js";

test("AdaptiveSenderTemplate starts in proposed", () => {
  const item = newAdaptiveSenderTemplate("code-18", "label-815");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSenderTemplate moves to rejected", () => {
  const item = newAdaptiveSenderTemplate("code-18", "label-815");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("AdaptiveSenderTemplate rejects moves from withdrawn", () => {
  const item = newAdaptiveSenderTemplate("code-18", "label-815");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
