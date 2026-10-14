import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeExceptionEngine } from "./badge-exception-engine.js";
import { newBadgeException } from "./badge-exception.js";

test("BadgeExceptionEngine keeps results within bounds", () => {
  const engine = defaultBadgeExceptionEngine();
  const item = newBadgeException("code-950", "title-527");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
