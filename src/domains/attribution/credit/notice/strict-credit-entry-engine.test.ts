import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictCreditEntryEngine } from "./strict-credit-entry-engine.js";
import { newStrictCreditEntry } from "./strict-credit-entry.js";

test("StrictCreditEntryEngine keeps results within bounds", () => {
  const engine = defaultStrictCreditEntryEngine(flags.newRegistry());
  const item = newStrictCreditEntry("code-458", "name-916");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
