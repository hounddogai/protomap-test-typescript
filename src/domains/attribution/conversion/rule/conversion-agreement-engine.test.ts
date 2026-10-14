import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionAgreementEngine } from "./conversion-agreement-engine.js";
import { newConversionAgreement } from "./conversion-agreement.js";

test("ConversionAgreementEngine keeps results within bounds", () => {
  const engine = defaultConversionAgreementEngine(flags.newRegistry());
  const item = newConversionAgreement("code-478", "name-911");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
