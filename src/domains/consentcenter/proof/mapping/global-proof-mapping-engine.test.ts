import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalProofMappingEngine } from "./global-proof-mapping-engine.js";
import { newGlobalProofMapping } from "./global-proof-mapping.js";

test("GlobalProofMappingEngine keeps results within bounds", () => {
  const engine = defaultGlobalProofMappingEngine(flags.newRegistry());
  const item = newGlobalProofMapping("code-830", "label-257");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
