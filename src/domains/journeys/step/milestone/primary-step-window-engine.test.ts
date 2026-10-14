import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryStepWindowEngine } from "./primary-step-window-engine.js";
import { newPrimaryStepWindow } from "./primary-step-window.js";

test("PrimaryStepWindowEngine keeps results within bounds", () => {
  const engine = defaultPrimaryStepWindowEngine(flags.newRegistry());
  const item = newPrimaryStepWindow("code-532", "name-370");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
