import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofEntryEngine } from "./proof-entry-engine.js";
import { newProofEntry } from "./proof-entry.js";

test("ProofEntryEngine keeps results within bounds", () => {
  const engine = defaultProofEntryEngine();
  const item = newProofEntry("code-417", "title-665");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
