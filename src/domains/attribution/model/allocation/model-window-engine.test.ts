import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelWindowEngine } from "./model-window-engine.js";
import { newModelWindow } from "./model-window.js";

test("ModelWindowEngine keeps results within bounds", () => {
  const engine = defaultModelWindowEngine(flags.newRegistry());
  const item = newModelWindow("code-509", "name-925");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
