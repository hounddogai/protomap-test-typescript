import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowRequest } from "./window-request.js";

test("WindowRequest starts in proposed", () => {
  const item = newWindowRequest("code-699", "title-550");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowRequest moves to approved", () => {
  const item = newWindowRequest("code-699", "title-550");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WindowRequest rejects moves from withdrawn", () => {
  const item = newWindowRequest("code-699", "title-550");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
