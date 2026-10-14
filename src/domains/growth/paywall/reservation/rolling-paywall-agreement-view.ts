import * as text from "../../../../kit/text.js";
import { RollingPaywallAgreement } from "./rolling-paywall-agreement.js";

/** How screens and exports show a rolling paywall agreement. */
export class RollingPaywallAgreementView {
  code: string;
  label: string;
  visible: string;
  capacityText: string;
  ratioText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    capacityText: string,
    ratioText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.capacityText = capacityText;
    this.ratioText = ratioText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPaywallAgreementView(item: RollingPaywallAgreement): RollingPaywallAgreementView {
  return new RollingPaywallAgreementView(
    item.code,
    item.label,
    `${item.visible}`,
    String(item.capacity),
    item.ratio.toFixed(2),
    text.truncate(item.variant, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPaywallAgreementViews(items: RollingPaywallAgreement[]): RollingPaywallAgreementView[] {
  const views: RollingPaywallAgreementView[] = [];
  for (const item of items) {
    views.push(toRollingPaywallAgreementView(item));
  }
  return views;
}

export function sumRollingPaywallAgreementView(view: RollingPaywallAgreementView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedCapacity + parsedRatio;
}
