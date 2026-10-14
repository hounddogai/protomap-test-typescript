import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionGroupEngine } from "./conversion-group-engine.js";
import { newConversionGroup } from "./conversion-group.js";

test("ConversionGroupEngine keeps results within bounds", () => {
  const engine = defaultConversionGroupEngine(flags.newRegistry());
  const item = newConversionGroup("code-723", "label-777");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
