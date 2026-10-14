import * as text from "../../../../kit/text.js";
import { EscalationAllocation } from "./escalation-allocation.js";

/** How screens and exports show a escalation allocation. */
export class EscalationAllocationView {
  codeText: string;
  name: string;
  segment: string;
  approved: string;
  capacityText: string;
  audienceId: string;
  costText: string;
  limit: string;
  floorValue: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    segment: string,
    approved: string,
    capacityText: string,
    audienceId: string,
    costText: string,
    limit: string,
    floorValue: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.segment = segment;
    this.approved = approved;
    this.capacityText = capacityText;
    this.audienceId = audienceId;
    this.costText = costText;
    this.limit = limit;
    this.floorValue = floorValue;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationAllocationView(item: EscalationAllocation): EscalationAllocationView {
  return new EscalationAllocationView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.segment, 80),
    `${item.approved}`,
    String(item.capacity),
    text.truncate(item.audienceId, 80),
    item.cost.toFixed(2),
    String(item.limit),
    item.floorValue.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationAllocationViews(items: EscalationAllocation[]): EscalationAllocationView[] {
  const views: EscalationAllocationView[] = [];
  for (const item of items) {
    views.push(toEscalationAllocationView(item));
  }
  return views;
}

export function sumEscalationAllocationView(view: EscalationAllocationView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedCapacity + parsedCost + parsedLimit;
}
