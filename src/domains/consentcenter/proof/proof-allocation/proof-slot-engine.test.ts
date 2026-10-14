import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofSlotEngine } from "./proof-slot-engine.js";
import { newProofSlot } from "./proof-slot.js";

test("ProofSlotEngine keeps results within bounds", () => {
  const engine = defaultProofSlotEngine();
  const item = newProofSlot("code-373", "title-715");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
