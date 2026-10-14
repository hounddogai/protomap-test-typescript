import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalProofSlotEngine } from "./global-proof-slot-engine.js";
import { newGlobalProofSlot } from "./global-proof-slot.js";

test("GlobalProofSlotEngine keeps results within bounds", () => {
  const engine = defaultGlobalProofSlotEngine();
  const item = newGlobalProofSlot("code-956", "label-139");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
