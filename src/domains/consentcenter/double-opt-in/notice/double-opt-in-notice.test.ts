import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInNotice } from "./double-opt-in-notice.js";

test("DoubleOptInNotice starts in proposed", () => {
  const item = newDoubleOptInNotice("code-702", "title-342");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInNotice moves to rejected", () => {
  const item = newDoubleOptInNotice("code-702", "title-342");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("DoubleOptInNotice rejects moves from withdrawn", () => {
  const item = newDoubleOptInNotice("code-702", "title-342");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
