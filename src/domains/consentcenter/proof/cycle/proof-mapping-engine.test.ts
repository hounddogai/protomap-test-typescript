import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofMappingEngine } from "./proof-mapping-engine.js";
import { newProofMapping } from "./proof-mapping.js";

test("ProofMappingEngine keeps results within bounds", () => {
  const engine = defaultProofMappingEngine(flags.newRegistry());
  const item = newProofMapping("code-360", "label-755");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
