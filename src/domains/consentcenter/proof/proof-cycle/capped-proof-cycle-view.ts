import * as text from "../../../../kit/text.js";
import { CappedProofCycle } from "./capped-proof-cycle.js";

/** How screens and exports show a capped proof cycle. */
export class CappedProofCycleView {
  codeText: string;
  name: string;
  title: string;
  cohortText: string;
  category: string;
  sendAt: string;
  priority: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    title: string,
    cohortText: string,
    category: string,
    sendAt: string,
    priority: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.title = title;
    this.cohortText = cohortText;
    this.category = category;
    this.sendAt = sendAt;
    this.priority = priority;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toCappedProofCycleView(item: CappedProofCycle): CappedProofCycleView {
  return new CappedProofCycleView(
    text.truncate(item.code, 64),
    item.name,
    item.title,
    item.cohort,
    item.category,
    String(item.sendAt),
    String(item.priority),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedProofCycleViews(items: CappedProofCycle[]): CappedProofCycleView[] {
  const views: CappedProofCycleView[] = [];
  for (const item of items) {
    views.push(toCappedProofCycleView(item));
  }
  return views;
}

export function sumCappedProofCycleView(view: CappedProofCycleView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedSendAt + parsedPriority + parsedThreshold;
}
