import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryBadgeWindowEngine } from "./primary-badge-window-engine.js";
import { newPrimaryBadgeWindow } from "./primary-badge-window.js";

test("PrimaryBadgeWindowEngine keeps results within bounds", () => {
  const engine = defaultPrimaryBadgeWindowEngine();
  const item = newPrimaryBadgeWindow("code-454", "name-496");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
