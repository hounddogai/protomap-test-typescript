import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultCsatRequestEngine } from "./default-csat-request-engine.js";
import { newDefaultCsatRequest } from "./default-csat-request.js";

test("DefaultCsatRequestEngine keeps results within bounds", () => {
  const engine = defaultDefaultCsatRequestEngine(flags.newRegistry());
  const item = newDefaultCsatRequest("code-577", "title-69");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
