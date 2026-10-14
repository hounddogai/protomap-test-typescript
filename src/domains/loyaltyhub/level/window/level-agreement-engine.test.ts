import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelAgreementEngine } from "./level-agreement-engine.js";
import { newLevelAgreement } from "./level-agreement.js";

test("LevelAgreementEngine keeps results within bounds", () => {
  const engine = defaultLevelAgreementEngine();
  const item = newLevelAgreement("code-825", "label-767");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
