import { FunnelException } from "./funnel-exception.js";

/** How screens and exports show a funnel exception. */
export class FunnelExceptionView {
  code: string;
  labelText: string;
  windowDays: string;
  margin: string;
  visible: string;
  attempts: string;
  versionText: string;
  quantity: string;
  archived: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    windowDays: string,
    margin: string,
    visible: string,
    attempts: string,
    versionText: string,
    quantity: string,
    archived: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.windowDays = windowDays;
    this.margin = margin;
    this.visible = visible;
    this.attempts = attempts;
    this.versionText = versionText;
    this.quantity = quantity;
    this.archived = archived;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelExceptionView(item: FunnelException): FunnelExceptionView {
  return new FunnelExceptionView(
    item.code,
    item.label,
    String(item.windowDays),
    item.margin.toFixed(2),
    `${item.visible}`,
    String(item.attempts),
    String(item.version),
    String(item.quantity),
    `${item.archived}`,
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelExceptionViews(items: FunnelException[]): FunnelExceptionView[] {
  const views: FunnelExceptionView[] = [];
  for (const item of items) {
    views.push(toFunnelExceptionView(item));
  }
  return views;
}

export function sumFunnelExceptionView(view: FunnelExceptionView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedWindowDays + parsedMargin + parsedAttempts;
}
