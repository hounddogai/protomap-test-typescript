import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientSlaTierEngine } from "./lenient-sla-tier-engine.js";
import { newLenientSlaTier } from "./lenient-sla-tier.js";

test("LenientSlaTierEngine keeps results within bounds", () => {
  const engine = defaultLenientSlaTierEngine(flags.newRegistry());
  const item = newLenientSlaTier("code-163", "label-711");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
