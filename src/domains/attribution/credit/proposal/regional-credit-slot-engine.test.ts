import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalCreditSlotEngine } from "./regional-credit-slot-engine.js";
import { newRegionalCreditSlot } from "./regional-credit-slot.js";

test("RegionalCreditSlotEngine keeps results within bounds", () => {
  const engine = defaultRegionalCreditSlotEngine();
  const item = newRegionalCreditSlot("code-234", "title-332");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
