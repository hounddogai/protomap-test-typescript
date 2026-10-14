import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyPacingAgreementEngine } from "./legacy-pacing-agreement-engine.js";
import { newLegacyPacingAgreement } from "./legacy-pacing-agreement.js";

test("LegacyPacingAgreementEngine keeps results within bounds", () => {
  const engine = defaultLegacyPacingAgreementEngine(flags.newRegistry());
  const item = newLegacyPacingAgreement("code-88", "title-317");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
