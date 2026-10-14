import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionForecastEngine } from "./mention-forecast-engine.js";
import { newMentionForecast } from "./mention-forecast.js";

test("MentionForecastEngine keeps results within bounds", () => {
  const engine = defaultMentionForecastEngine();
  const item = newMentionForecast("code-960", "name-759");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
