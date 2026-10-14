import { InviteTemplate } from "./invite-template.js";

/** How screens and exports show a invite template. */
export class InviteTemplateView {
  code: string;
  label: string;
  locale: string;
  endsAt: string;
  unit: string;
  statusLabel: string;

  constructor(code: string, label: string, locale: string, endsAt: string, unit: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.endsAt = endsAt;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toInviteTemplateView(item: InviteTemplate): InviteTemplateView {
  return new InviteTemplateView(
    item.code,
    item.label,
    item.locale,
    String(item.endsAt),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteTemplateViews(items: InviteTemplate[]): InviteTemplateView[] {
  const views: InviteTemplateView[] = [];
  for (const item of items) {
    views.push(toInviteTemplateView(item));
  }
  return views;
}

export function sumInviteTemplateView(view: InviteTemplateView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedEndsAt;
}
