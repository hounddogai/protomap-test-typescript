import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencySnapshot } from "./frequency-snapshot.js";

test("FrequencySnapshot starts in created", () => {
  const item = newFrequencySnapshot("code-385", "title-477");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencySnapshot moves to published", () => {
  const item = newFrequencySnapshot("code-385", "title-477");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FrequencySnapshot rejects moves from retired", () => {
  const item = newFrequencySnapshot("code-385", "title-477");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
