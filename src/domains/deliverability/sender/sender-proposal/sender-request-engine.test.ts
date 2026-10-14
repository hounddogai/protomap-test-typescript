import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderRequestEngine } from "./sender-request-engine.js";
import { newSenderRequest } from "./sender-request.js";

test("SenderRequestEngine keeps results within bounds", () => {
  const engine = defaultSenderRequestEngine(flags.newRegistry());
  const item = newSenderRequest("code-634", "title-270");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
