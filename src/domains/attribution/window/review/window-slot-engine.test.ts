import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowSlotEngine } from "./window-slot-engine.js";
import { newWindowSlot } from "./window-slot.js";

test("WindowSlotEngine keeps results within bounds", () => {
  const engine = defaultWindowSlotEngine(flags.newRegistry());
  const item = newWindowSlot("code-711", "name-542");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
