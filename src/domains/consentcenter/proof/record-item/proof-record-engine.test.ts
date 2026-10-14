import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofRecordEngine } from "./proof-record-engine.js";
import { newProofRecord } from "./proof-record.js";

test("ProofRecordEngine keeps results within bounds", () => {
  const engine = defaultProofRecordEngine();
  const item = newProofRecord("code-531", "label-332");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
