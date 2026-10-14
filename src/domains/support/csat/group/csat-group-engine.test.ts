import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatGroupEngine } from "./csat-group-engine.js";
import { newCsatGroup } from "./csat-group.js";

test("CsatGroupEngine keeps results within bounds", () => {
  const engine = defaultCsatGroupEngine();
  const item = newCsatGroup("code-883", "title-796");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
