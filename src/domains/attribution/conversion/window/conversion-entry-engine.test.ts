import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionEntryEngine } from "./conversion-entry-engine.js";
import { newConversionEntry } from "./conversion-entry.js";

test("ConversionEntryEngine keeps results within bounds", () => {
  const engine = defaultConversionEntryEngine();
  const item = newConversionEntry("code-120", "title-786");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
