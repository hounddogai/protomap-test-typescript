import { SeasonalRewardRuleForecast } from "./seasonal-reward-rule-forecast.js";

/** How screens and exports show a seasonal reward rule forecast. */
export class SeasonalRewardRuleForecastView {
  code: string;
  name: string;
  budgetText: string;
  floorValue: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budgetText: string,
    floorValue: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budgetText = budgetText;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRewardRuleForecastView(item: SeasonalRewardRuleForecast): SeasonalRewardRuleForecastView {
  return new SeasonalRewardRuleForecastView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRewardRuleForecastViews(items: SeasonalRewardRuleForecast[]): SeasonalRewardRuleForecastView[] {
  const views: SeasonalRewardRuleForecastView[] = [];
  for (const item of items) {
    views.push(toSeasonalRewardRuleForecastView(item));
  }
  return views;
}

export function sumSeasonalRewardRuleForecastView(view: SeasonalRewardRuleForecastView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedBudget + parsedFloorValue + parsedSequence;
}
