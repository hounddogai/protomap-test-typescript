import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualFlightTemplateEngine } from "./manual-flight-template-engine.js";
import { newManualFlightTemplate } from "./manual-flight-template.js";

test("ManualFlightTemplateEngine keeps results within bounds", () => {
  const engine = defaultManualFlightTemplateEngine();
  const item = newManualFlightTemplate("code-152", "title-741");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
