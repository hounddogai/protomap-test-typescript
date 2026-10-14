import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalComplaintWindowEngine } from "./regional-complaint-window-engine.js";
import { newRegionalComplaintWindow } from "./regional-complaint-window.js";

test("RegionalComplaintWindowEngine keeps results within bounds", () => {
  const engine = defaultRegionalComplaintWindowEngine();
  const item = newRegionalComplaintWindow("code-965", "name-732");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
