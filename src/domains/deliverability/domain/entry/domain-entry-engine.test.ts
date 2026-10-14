import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainEntryEngine } from "./domain-entry-engine.js";
import { newDomainEntry } from "./domain-entry.js";

test("DomainEntryEngine keeps results within bounds", () => {
  const engine = defaultDomainEntryEngine(flags.newRegistry());
  const item = newDomainEntry("code-247", "name-817");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
