import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainExceptionEngine } from "./domain-exception-engine.js";
import { newDomainException } from "./domain-exception.js";

test("DomainExceptionEngine keeps results within bounds", () => {
  const engine = defaultDomainExceptionEngine();
  const item = newDomainException("code-182", "title-40");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
