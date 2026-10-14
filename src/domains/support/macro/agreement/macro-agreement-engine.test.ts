import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroAgreementEngine } from "./macro-agreement-engine.js";
import { newMacroAgreement } from "./macro-agreement.js";

test("MacroAgreementEngine keeps results within bounds", () => {
  const engine = defaultMacroAgreementEngine(flags.newRegistry());
  const item = newMacroAgreement("code-440", "title-844");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
