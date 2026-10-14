import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaMapping } from "./sla-mapping.js";

test("SlaMapping starts in proposed", () => {
  const item = newSlaMapping("code-3", "name-359");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaMapping moves to withdrawn", () => {
  const item = newSlaMapping("code-3", "name-359");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("SlaMapping rejects moves from withdrawn", () => {
  const item = newSlaMapping("code-3", "name-359");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
