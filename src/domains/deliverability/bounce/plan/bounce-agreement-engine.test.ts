import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceAgreementEngine } from "./bounce-agreement-engine.js";
import { newBounceAgreement } from "./bounce-agreement.js";

test("BounceAgreementEngine keeps results within bounds", () => {
  const engine = defaultBounceAgreementEngine(flags.newRegistry());
  const item = newBounceAgreement("code-509", "title-430");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
