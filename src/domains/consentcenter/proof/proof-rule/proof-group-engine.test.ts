import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofGroupEngine } from "./proof-group-engine.js";
import { newProofGroup } from "./proof-group.js";

test("ProofGroupEngine keeps results within bounds", () => {
  const engine = defaultProofGroupEngine(flags.newRegistry());
  const item = newProofGroup("code-932", "title-572");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
