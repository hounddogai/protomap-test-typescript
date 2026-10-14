import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofOverrideEngine } from "./proof-override-engine.js";
import { newProofOverride } from "./proof-override.js";

test("ProofOverrideEngine keeps results within bounds", () => {
  const engine = defaultProofOverrideEngine(flags.newRegistry());
  const item = newProofOverride("code-467", "title-106");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
