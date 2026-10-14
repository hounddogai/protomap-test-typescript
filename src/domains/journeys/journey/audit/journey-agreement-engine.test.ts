import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyAgreementEngine } from "./journey-agreement-engine.js";
import { newJourneyAgreement } from "./journey-agreement.js";

test("JourneyAgreementEngine keeps results within bounds", () => {
  const engine = defaultJourneyAgreementEngine(flags.newRegistry());
  const item = newJourneyAgreement("code-295", "title-381");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
