import { PrimaryTouchpointAgreement } from "./primary-touchpoint-agreement.js";

/** How screens and exports show a primary touchpoint agreement. */
export class PrimaryTouchpointAgreementView {
  codeText: string;
  label: string;
  pinned: string;
  utmSourceText: string;
  quantity: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    pinned: string,
    utmSourceText: string,
    quantity: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.pinned = pinned;
    this.utmSourceText = utmSourceText;
    this.quantity = quantity;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTouchpointAgreementView(item: PrimaryTouchpointAgreement): PrimaryTouchpointAgreementView {
  return new PrimaryTouchpointAgreementView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.utmSource,
    String(item.quantity),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTouchpointAgreementViews(items: PrimaryTouchpointAgreement[]): PrimaryTouchpointAgreementView[] {
  const views: PrimaryTouchpointAgreementView[] = [];
  for (const item of items) {
    views.push(toPrimaryTouchpointAgreementView(item));
  }
  return views;
}

export function sumPrimaryTouchpointAgreementView(view: PrimaryTouchpointAgreementView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedQuantity + parsedVersion;
}
