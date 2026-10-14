import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualStreakAgreementEngine } from "./manual-streak-agreement-engine.js";
import { newManualStreakAgreement } from "./manual-streak-agreement.js";

test("ManualStreakAgreementEngine keeps results within bounds", () => {
  const engine = defaultManualStreakAgreementEngine();
  const item = newManualStreakAgreement("code-522", "title-139");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
