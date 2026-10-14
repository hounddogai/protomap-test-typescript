import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalEnrollmentWindowEngine } from "./seasonal-enrollment-window-engine.js";
import { newSeasonalEnrollmentWindow } from "./seasonal-enrollment-window.js";

test("SeasonalEnrollmentWindowEngine keeps results within bounds", () => {
  const engine = defaultSeasonalEnrollmentWindowEngine();
  const item = newSeasonalEnrollmentWindow("code-874", "title-278");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
