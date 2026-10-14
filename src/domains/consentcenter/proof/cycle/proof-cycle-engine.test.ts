import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofCycleEngine } from "./proof-cycle-engine.js";
import { newProofCycle } from "./proof-cycle.js";

test("ProofCycleEngine keeps results within bounds", () => {
  const engine = defaultProofCycleEngine(flags.newRegistry());
  const item = newProofCycle("code-430", "title-130");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
