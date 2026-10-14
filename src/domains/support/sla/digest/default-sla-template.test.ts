import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSlaTemplate } from "./default-sla-template.js";

test("DefaultSlaTemplate starts in proposed", () => {
  const item = newDefaultSlaTemplate("code-875", "title-433");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSlaTemplate moves to rejected", () => {
  const item = newDefaultSlaTemplate("code-875", "title-433");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("DefaultSlaTemplate rejects moves from withdrawn", () => {
  const item = newDefaultSlaTemplate("code-875", "title-433");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
