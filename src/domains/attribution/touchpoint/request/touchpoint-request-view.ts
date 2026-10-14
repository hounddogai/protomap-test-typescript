import { TouchpointRequest } from "./touchpoint-request.js";

/** How screens and exports show a touchpoint request. */
export class TouchpointRequestView {
  codeText: string;
  name: string;
  cohort: string;
  sequence: string;
  createdAt: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohort: string,
    sequence: string,
    createdAt: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohort = cohort;
    this.sequence = sequence;
    this.createdAt = createdAt;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointRequestView(item: TouchpointRequest): TouchpointRequestView {
  return new TouchpointRequestView(
    item.code,
    item.name,
    item.cohort,
    String(item.sequence),
    String(item.createdAt),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointRequestViews(items: TouchpointRequest[]): TouchpointRequestView[] {
  const views: TouchpointRequestView[] = [];
  for (const item of items) {
    views.push(toTouchpointRequestView(item));
  }
  return views;
}

export function sumTouchpointRequestView(view: TouchpointRequestView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedSequence + parsedCreatedAt + parsedCost;
}
