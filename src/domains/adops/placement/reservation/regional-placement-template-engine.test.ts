import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPlacementTemplateEngine } from "./regional-placement-template-engine.js";
import { newRegionalPlacementTemplate } from "./regional-placement-template.js";

test("RegionalPlacementTemplateEngine keeps results within bounds", () => {
  const engine = defaultRegionalPlacementTemplateEngine(flags.newRegistry());
  const item = newRegionalPlacementTemplate("code-495", "title-797");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
