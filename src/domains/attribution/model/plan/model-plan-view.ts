import * as text from "../../../../kit/text.js";
import { ModelPlan } from "./model-plan.js";

/** How screens and exports show a model plan. */
export class ModelPlanView {
  code: string;
  title: string;
  segmentText: string;
  budget: string;
  source: string;
  label: string;
  ownerIdText: string;
  openRate: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    segmentText: string,
    budget: string,
    source: string,
    label: string,
    ownerIdText: string,
    openRate: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.segmentText = segmentText;
    this.budget = budget;
    this.source = source;
    this.label = label;
    this.ownerIdText = ownerIdText;
    this.openRate = openRate;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toModelPlanView(item: ModelPlan): ModelPlanView {
  return new ModelPlanView(
    item.code,
    text.truncate(item.title, 40),
    text.truncate(item.segment, 80),
    item.budget.toFixed(2),
    item.source,
    item.label,
    item.ownerId,
    item.openRate.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelPlanViews(items: ModelPlan[]): ModelPlanView[] {
  const views: ModelPlanView[] = [];
  for (const item of items) {
    views.push(toModelPlanView(item));
  }
  return views;
}

export function sumModelPlanView(view: ModelPlanView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedBudget + parsedOpenRate;
}
