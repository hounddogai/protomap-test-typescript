import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientWarmupTemplateEngine } from "./lenient-warmup-template-engine.js";
import { newLenientWarmupTemplate } from "./lenient-warmup-template.js";

test("LenientWarmupTemplateEngine keeps results within bounds", () => {
  const engine = defaultLenientWarmupTemplateEngine(flags.newRegistry());
  const item = newLenientWarmupTemplate("code-596", "label-255");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
