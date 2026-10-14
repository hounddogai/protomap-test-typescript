import { FraudCheckException } from "./fraud-check-exception.js";

/** How screens and exports show a fraud check exception. */
export class FraudCheckExceptionView {
  code: string;
  title: string;
  currency: string;
  source: string;
  createdAt: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    currency: string,
    source: string,
    createdAt: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.source = source;
    this.createdAt = createdAt;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckExceptionView(item: FraudCheckException): FraudCheckExceptionView {
  return new FraudCheckExceptionView(
    item.code,
    item.title,
    item.currency,
    item.source,
    String(item.createdAt),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckExceptionViews(items: FraudCheckException[]): FraudCheckExceptionView[] {
  const views: FraudCheckExceptionView[] = [];
  for (const item of items) {
    views.push(toFraudCheckExceptionView(item));
  }
  return views;
}

export function sumFraudCheckExceptionView(view: FraudCheckExceptionView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCreatedAt;
}
