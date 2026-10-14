import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofRollupEngine } from "./proof-rollup-engine.js";
import { newProofRollup } from "./proof-rollup.js";

test("ProofRollupEngine keeps results within bounds", () => {
  const engine = defaultProofRollupEngine(flags.newRegistry());
  const item = newProofRollup("code-377", "label-113");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
