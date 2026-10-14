import { LenientFlightPlan } from "./lenient-flight-plan.js";

/** How screens and exports show a lenient flight plan. */
export class LenientFlightPlanView {
  codeText: string;
  name: string;
  batchSizeText: string;
  startsAtText: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    batchSizeText: string,
    startsAtText: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.batchSizeText = batchSizeText;
    this.startsAtText = startsAtText;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFlightPlanView(item: LenientFlightPlan): LenientFlightPlanView {
  return new LenientFlightPlanView(
    item.code,
    item.name,
    String(item.batchSize),
    String(item.startsAt),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFlightPlanViews(items: LenientFlightPlan[]): LenientFlightPlanView[] {
  const views: LenientFlightPlanView[] = [];
  for (const item of items) {
    views.push(toLenientFlightPlanView(item));
  }
  return views;
}

export function sumLenientFlightPlanView(view: LenientFlightPlanView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedBatchSize + parsedStartsAt;
}
