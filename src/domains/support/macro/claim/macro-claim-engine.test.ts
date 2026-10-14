import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroClaimEngine } from "./macro-claim-engine.js";
import { newMacroClaim } from "./macro-claim.js";

test("MacroClaimEngine keeps results within bounds", () => {
  const engine = defaultMacroClaimEngine(flags.newRegistry());
  const item = newMacroClaim("code-375", "name-521");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
