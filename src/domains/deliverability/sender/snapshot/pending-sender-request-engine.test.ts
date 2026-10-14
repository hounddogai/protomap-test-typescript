import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingSenderRequestEngine } from "./pending-sender-request-engine.js";
import { newPendingSenderRequest } from "./pending-sender-request.js";

test("PendingSenderRequestEngine keeps results within bounds", () => {
  const engine = defaultPendingSenderRequestEngine(flags.newRegistry());
  const item = newPendingSenderRequest("code-708", "title-389");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
