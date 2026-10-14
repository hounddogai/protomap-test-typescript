import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledCreditBundleEngine } from "./scheduled-credit-bundle-engine.js";
import { newScheduledCreditBundle } from "./scheduled-credit-bundle.js";

test("ScheduledCreditBundleEngine keeps results within bounds", () => {
  const engine = defaultScheduledCreditBundleEngine();
  const item = newScheduledCreditBundle("code-723", "title-924");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
