import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientPostWindowEngine } from "./lenient-post-window-engine.js";
import { newLenientPostWindow } from "./lenient-post-window.js";

test("LenientPostWindowEngine keeps results within bounds", () => {
  const engine = defaultLenientPostWindowEngine(flags.newRegistry());
  const item = newLenientPostWindow("code-386", "label-521");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
