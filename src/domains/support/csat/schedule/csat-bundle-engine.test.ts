import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCsatBundleEngine } from "./csat-bundle-engine.js";
import { newCsatBundle } from "./csat-bundle.js";

test("CsatBundleEngine keeps results within bounds", () => {
  const engine = defaultCsatBundleEngine(flags.newRegistry());
  const item = newCsatBundle("code-250", "title-530");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
