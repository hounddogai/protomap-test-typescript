import * as text from "../../../../kit/text.js";
import { FallbackSlaTemplate } from "./fallback-sla-template.js";

/** How screens and exports show a fallback sla template. */
export class FallbackSlaTemplateView {
  code: string;
  labelText: string;
  visibleText: string;
  startsAt: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    visibleText: string,
    startsAt: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.visibleText = visibleText;
    this.startsAt = startsAt;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSlaTemplateView(item: FallbackSlaTemplate): FallbackSlaTemplateView {
  return new FallbackSlaTemplateView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 40),
    `${item.visible}`,
    String(item.startsAt),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSlaTemplateViews(items: FallbackSlaTemplate[]): FallbackSlaTemplateView[] {
  const views: FallbackSlaTemplateView[] = [];
  for (const item of items) {
    views.push(toFallbackSlaTemplateView(item));
  }
  return views;
}

export function sumFallbackSlaTemplateView(view: FallbackSlaTemplateView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedStartsAt + parsedImpressions;
}
