import { RollingSenderQuota } from "./rolling-sender-quota.js";

/** How screens and exports show a rolling sender quota. */
export class RollingSenderQuotaView {
  codeText: string;
  name: string;
  weight: string;
  quantity: string;
  createdAtText: string;
  phone: string;
  approved: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    weight: string,
    quantity: string,
    createdAtText: string,
    phone: string,
    approved: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.weight = weight;
    this.quantity = quantity;
    this.createdAtText = createdAtText;
    this.phone = phone;
    this.approved = approved;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSenderQuotaView(item: RollingSenderQuota): RollingSenderQuotaView {
  return new RollingSenderQuotaView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    String(item.quantity),
    String(item.createdAt),
    item.phone,
    `${item.approved}`,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSenderQuotaViews(items: RollingSenderQuota[]): RollingSenderQuotaView[] {
  const views: RollingSenderQuotaView[] = [];
  for (const item of items) {
    views.push(toRollingSenderQuotaView(item));
  }
  return views;
}

export function sumRollingSenderQuotaView(view: RollingSenderQuotaView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedWeight + parsedQuantity + parsedCreatedAt;
}
