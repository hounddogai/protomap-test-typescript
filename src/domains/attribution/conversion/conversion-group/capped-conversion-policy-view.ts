import { CappedConversionPolicy } from "./capped-conversion-policy.js";

/** How screens and exports show a capped conversion policy. */
export class CappedConversionPolicyView {
  code: string;
  name: string;
  phone: string;
  createdAtText: string;
  ceilingText: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    createdAtText: string,
    ceilingText: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.createdAtText = createdAtText;
    this.ceilingText = ceilingText;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedConversionPolicyView(item: CappedConversionPolicy): CappedConversionPolicyView {
  return new CappedConversionPolicyView(
    item.code,
    item.name,
    item.phone,
    String(item.createdAt),
    item.ceiling.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedConversionPolicyViews(items: CappedConversionPolicy[]): CappedConversionPolicyView[] {
  const views: CappedConversionPolicyView[] = [];
  for (const item of items) {
    views.push(toCappedConversionPolicyView(item));
  }
  return views;
}

export function sumCappedConversionPolicyView(view: CappedConversionPolicyView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCreatedAt + parsedCeiling;
}
