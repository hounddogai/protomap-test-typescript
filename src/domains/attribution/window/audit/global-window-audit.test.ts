import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalWindowAudit } from "./global-window-audit.js";

test("GlobalWindowAudit starts in proposed", () => {
  const item = newGlobalWindowAudit("code-102", "name-178");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalWindowAudit moves to withdrawn", () => {
  const item = newGlobalWindowAudit("code-102", "name-178");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("GlobalWindowAudit rejects moves from withdrawn", () => {
  const item = newGlobalWindowAudit("code-102", "name-178");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
