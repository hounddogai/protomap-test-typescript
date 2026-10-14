import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroDraft } from "./macro-draft.js";

test("MacroDraft starts in created", () => {
  const item = newMacroDraft("code-138", "title-108");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroDraft moves to validated", () => {
  const item = newMacroDraft("code-138", "title-108");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("MacroDraft rejects moves from retired", () => {
  const item = newMacroDraft("code-138", "title-108");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
