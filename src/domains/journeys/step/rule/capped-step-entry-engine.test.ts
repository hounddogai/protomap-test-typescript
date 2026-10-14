import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedStepEntryEngine } from "./capped-step-entry-engine.js";
import { newCappedStepEntry } from "./capped-step-entry.js";

test("CappedStepEntryEngine keeps results within bounds", () => {
  const engine = defaultCappedStepEntryEngine(flags.newRegistry());
  const item = newCappedStepEntry("code-126", "label-792");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
