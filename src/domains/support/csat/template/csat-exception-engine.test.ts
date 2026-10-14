import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCsatExceptionEngine } from "./csat-exception-engine.js";
import { newCsatException } from "./csat-exception.js";

test("CsatExceptionEngine keeps results within bounds", () => {
  const engine = defaultCsatExceptionEngine(flags.newRegistry());
  const item = newCsatException("code-139", "title-355");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
