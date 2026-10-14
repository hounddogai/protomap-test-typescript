import * as text from "../../../../kit/text.js";
import { RewardRuleForecast } from "./reward-rule-forecast.js";

/** How screens and exports show a reward rule forecast. */
export class RewardRuleForecastView {
  codeText: string;
  label: string;
  utmSource: string;
  visible: string;
  description: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    utmSource: string,
    visible: string,
    description: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.utmSource = utmSource;
    this.visible = visible;
    this.description = description;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleForecastView(item: RewardRuleForecast): RewardRuleForecastView {
  return new RewardRuleForecastView(
    item.code,
    item.label,
    text.truncate(item.utmSource, 120),
    `${item.visible}`,
    text.truncate(item.description, 40),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleForecastViews(items: RewardRuleForecast[]): RewardRuleForecastView[] {
  const views: RewardRuleForecastView[] = [];
  for (const item of items) {
    views.push(toRewardRuleForecastView(item));
  }
  return views;
}

export function sumRewardRuleForecastView(view: RewardRuleForecastView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
