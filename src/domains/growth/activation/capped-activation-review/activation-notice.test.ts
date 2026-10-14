import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationNotice } from "./activation-notice.js";

test("ActivationNotice starts in proposed", () => {
  const item = newActivationNotice("code-656", "label-919");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationNotice moves to rejected", () => {
  const item = newActivationNotice("code-656", "label-919");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ActivationNotice rejects moves from withdrawn", () => {
  const item = newActivationNotice("code-656", "label-919");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
