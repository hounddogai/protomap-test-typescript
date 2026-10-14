import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalSenderRequestEngine } from "./global-sender-request-engine.js";
import { newGlobalSenderRequest } from "./global-sender-request.js";

test("GlobalSenderRequestEngine keeps results within bounds", () => {
  const engine = defaultGlobalSenderRequestEngine(flags.newRegistry());
  const item = newGlobalSenderRequest("code-212", "name-643");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
