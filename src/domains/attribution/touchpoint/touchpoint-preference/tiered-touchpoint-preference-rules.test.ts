import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTouchpointPreferenceRequiredCountryRule,
  TieredTouchpointPreferenceRequiredNameRule,
  TieredTouchpointPreferenceRequiredUtmSourceRule,
  defaultTieredTouchpointPreferenceValidator,
} from "./tiered-touchpoint-preference-rules.js";
import { newTieredTouchpointPreference } from "./tiered-touchpoint-preference.js";

test("TieredTouchpointPreferenceValidator reports every problem", () => {
  const validator = defaultTieredTouchpointPreferenceValidator();
  const item = newTieredTouchpointPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTouchpointPreferenceRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new TieredTouchpointPreferenceRequiredUtmSourceRule("tiered touchpoint preference needs a value");
  const item = newTieredTouchpointPreference("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTouchpointPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new TieredTouchpointPreferenceRequiredNameRule("tiered touchpoint preference needs an entry");
  const item = newTieredTouchpointPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTouchpointPreferenceRequiredCountryRule flags a blank country", () => {
  const rule = new TieredTouchpointPreferenceRequiredCountryRule("tiered touchpoint preference needs this field");
  const item = newTieredTouchpointPreference("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
