import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalComplaintAgreementEngine } from "./seasonal-complaint-agreement-engine.js";
import { newSeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

test("SeasonalComplaintAgreementEngine keeps results within bounds", () => {
  const engine = defaultSeasonalComplaintAgreementEngine();
  const item = newSeasonalComplaintAgreement("code-278", "name-649");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
