import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroPolicyEngine } from "./macro-policy-engine.js";
import { newMacroPolicy } from "./macro-policy.js";

test("MacroPolicyEngine keeps results within bounds", () => {
  const engine = defaultMacroPolicyEngine(flags.newRegistry());
  const item = newMacroPolicy("code-342", "title-110");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
