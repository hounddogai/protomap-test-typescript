import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientFrequencyAgreementEngine } from "./lenient-frequency-agreement-engine.js";
import { newLenientFrequencyAgreement } from "./lenient-frequency-agreement.js";

test("LenientFrequencyAgreementEngine keeps results within bounds", () => {
  const engine = defaultLenientFrequencyAgreementEngine(flags.newRegistry());
  const item = newLenientFrequencyAgreement("code-86", "name-587");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
