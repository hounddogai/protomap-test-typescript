import * as text from "../../../../kit/text.js";
import { PathCycle } from "./path-cycle.js";

/** How screens and exports show a path cycle. */
export class PathCycleView {
  code: string;
  name: string;
  approvedText: string;
  summary: string;
  channelText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    approvedText: string,
    summary: string,
    channelText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.approvedText = approvedText;
    this.summary = summary;
    this.channelText = channelText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toPathCycleView(item: PathCycle): PathCycleView {
  return new PathCycleView(
    item.code,
    item.name,
    `${item.approved}`,
    item.summary,
    text.truncate(item.channel, 120),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathCycleViews(items: PathCycle[]): PathCycleView[] {
  const views: PathCycleView[] = [];
  for (const item of items) {
    views.push(toPathCycleView(item));
  }
  return views;
}

export function sumPathCycleView(view: PathCycleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
