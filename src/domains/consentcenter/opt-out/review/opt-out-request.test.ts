import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutRequest } from "./opt-out-request.js";

test("OptOutRequest starts in open", () => {
  const item = newOptOutRequest("code-724", "title-428");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutRequest moves to reopened", () => {
  const item = newOptOutRequest("code-724", "title-428");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("OptOutRequest rejects moves from archived", () => {
  const item = newOptOutRequest("code-724", "title-428");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
