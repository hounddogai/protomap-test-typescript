import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelAgreementEngine } from "./model-agreement-engine.js";
import { newModelAgreement } from "./model-agreement.js";

test("ModelAgreementEngine keeps results within bounds", () => {
  const engine = defaultModelAgreementEngine(flags.newRegistry());
  const item = newModelAgreement("code-583", "title-98");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
