import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictWindowGroupEngine } from "./strict-window-group-engine.js";
import { newStrictWindowGroup } from "./strict-window-group.js";

test("StrictWindowGroupEngine keeps results within bounds", () => {
  const engine = defaultStrictWindowGroupEngine(flags.newRegistry());
  const item = newStrictWindowGroup("code-793", "label-130");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
