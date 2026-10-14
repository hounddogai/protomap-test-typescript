import * as text from "../../../../kit/text.js";
import { LevelPlan } from "./level-plan.js";

/** How screens and exports show a level plan. */
export class LevelPlanView {
  code: string;
  label: string;
  externalRef: string;
  minimumText: string;
  phone: string;
  createdAt: string;
  quantity: string;
  capacityText: string;
  contactEmail: string;
  revision: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    minimumText: string,
    phone: string,
    createdAt: string,
    quantity: string,
    capacityText: string,
    contactEmail: string,
    revision: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.minimumText = minimumText;
    this.phone = phone;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.capacityText = capacityText;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toLevelPlanView(item: LevelPlan): LevelPlanView {
  return new LevelPlanView(
    item.code,
    item.label,
    item.externalRef,
    item.minimum.toFixed(2),
    text.truncate(item.phone, 80),
    String(item.createdAt),
    String(item.quantity),
    String(item.capacity),
    item.contactEmail,
    String(item.revision),
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelPlanViews(items: LevelPlan[]): LevelPlanView[] {
  const views: LevelPlanView[] = [];
  for (const item of items) {
    views.push(toLevelPlanView(item));
  }
  return views;
}

export function sumLevelPlanView(view: LevelPlanView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMinimum + parsedCreatedAt + parsedQuantity;
}
