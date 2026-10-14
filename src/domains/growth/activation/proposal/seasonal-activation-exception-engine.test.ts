import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalActivationExceptionEngine } from "./seasonal-activation-exception-engine.js";
import { newSeasonalActivationException } from "./seasonal-activation-exception.js";

test("SeasonalActivationExceptionEngine keeps results within bounds", () => {
  const engine = defaultSeasonalActivationExceptionEngine();
  const item = newSeasonalActivationException("code-807", "title-337");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
