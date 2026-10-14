import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationSlotEngine } from "./activation-slot-engine.js";
import { newActivationSlot } from "./activation-slot.js";

test("ActivationSlotEngine keeps results within bounds", () => {
  const engine = defaultActivationSlotEngine();
  const item = newActivationSlot("code-697", "name-444");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
