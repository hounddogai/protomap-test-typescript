import * as text from "../../../../kit/text.js";
import { DefaultDomainTemplate } from "./default-domain-template.js";

/** How screens and exports show a default domain template. */
export class DefaultDomainTemplateView {
  code: string;
  name: string;
  approved: string;
  utmSourceText: string;
  startsAtText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    approved: string,
    utmSourceText: string,
    startsAtText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.utmSourceText = utmSourceText;
    this.startsAtText = startsAtText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultDomainTemplateView(item: DefaultDomainTemplate): DefaultDomainTemplateView {
  return new DefaultDomainTemplateView(
    text.truncate(item.code, 40),
    item.name,
    `${item.approved}`,
    text.truncate(item.utmSource, 120),
    String(item.startsAt),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultDomainTemplateViews(items: DefaultDomainTemplate[]): DefaultDomainTemplateView[] {
  const views: DefaultDomainTemplateView[] = [];
  for (const item of items) {
    views.push(toDefaultDomainTemplateView(item));
  }
  return views;
}

export function sumDefaultDomainTemplateView(view: DefaultDomainTemplateView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedStartsAt;
}
